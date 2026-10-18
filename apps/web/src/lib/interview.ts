import { and, asc, eq, sql as dsql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { interview, orgSettings, source, utterance } from "@/db/schema";
import type { InterviewMode, Note, Topic } from "@/db/app-schema";
import { completeText, streamText, structured } from "@/lib/llm";
import {
  COVERAGE_SYSTEM,
  DRAFT_SYSTEM,
  TOPICS_SYSTEM,
  interviewStateMessage,
  interviewerSystemPrompt,
  openingInstruction,
  MODE_LABELS,
} from "@/lib/prompts/interview";
import { DEFAULT_TOPICS } from "@/lib/constants";
import { WRITING_RULES } from "@/lib/prompts/style";
import type Anthropic from "@anthropic-ai/sdk";

export type InterviewRow = typeof interview.$inferSelect;
export type UtteranceRow = typeof utterance.$inferSelect;

export async function getSettings(orgId: string) {
  const [row] = await db.select().from(orgSettings).where(eq(orgSettings.orgId, orgId));
  return row ?? { orgId, wikiSchema: "", interviewerNotes: "", glossary: "", apiKeyHash: null, apiKeyPrefix: null, notionTokenEnc: null, notionParentPageId: null };
}

export async function getInterview(orgId: string, id: string) {
  const [row] = await db.select().from(interview).where(and(eq(interview.id, id), eq(interview.orgId, orgId)));
  return row ?? null;
}

export async function getUtterances(interviewId: string) {
  return db.select().from(utterance).where(eq(utterance.interviewId, interviewId)).orderBy(asc(utterance.seq));
}

export async function createInterview(input: {
  orgId: string;
  userId: string;
  mode: InterviewMode;
  title: string;
  area: string;
  goal: string;
  background: string;
  expertName: string;
  checklist: string[];
}) {
  // Plan interview-specific topics, but never make the expert wait more than 4 seconds for it.
  const planned = structured({
    schema: z.object({ topics: z.array(z.string()) }),
    system: TOPICS_SYSTEM,
    effort: "low",
    maxTokens: 4000,
    messages: [
      {
        role: "user",
        content: `Interview type: ${MODE_LABELS[input.mode].label}\nTitle: ${input.title}\nArea: ${input.area}\nGoal: ${input.goal}\nBackground: ${input.background}`,
      },
    ],
    fast: true,
  })
    .then((r) => r.topics)
    .catch(() => null);
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 4000));
  const topics = (await Promise.race([planned, timeout])) ?? DEFAULT_TOPICS[input.mode];
  const [row] = await db
    .insert(interview)
    .values({
      orgId: input.orgId,
      createdBy: input.userId,
      mode: input.mode,
      title: input.title,
      area: input.area,
      goal: input.goal,
      background: input.background,
      expertName: input.expertName,
      topics: topics.slice(0, 8).map((label) => ({ id: crypto.randomUUID().slice(0, 8), label, covered: false })),
      checklist: input.checklist.filter(Boolean).map((text) => ({ id: crypto.randomUUID().slice(0, 8), text, done: false })),
    })
    .returning();
  return row;
}

/** Interviewer = assistant, expert = user. Volatile state rides on the last user turn. */
export function buildMessages(iv: InterviewRow, utts: UtteranceRow[]): Anthropic.Beta.BetaMessageParam[] {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: openingInstruction(iv.expertName) }];
  for (const u of utts) messages.push({ role: u.speaker === "interviewer" ? "assistant" : "user", content: u.text });
  const state = interviewStateMessage(iv);
  const last = messages[messages.length - 1];
  if (last.role === "user") last.content = `${last.content as string}\n\n${state}`;
  else messages.push({ role: "user", content: `(The expert is waiting for your next question.)\n\n${state}` });
  return messages;
}

export async function interviewerSystem(iv: InterviewRow, voice: boolean) {
  const s = await getSettings(iv.orgId);
  return interviewerSystemPrompt({ mode: iv.mode, voice, interviewerNotes: s.interviewerNotes, glossary: s.glossary });
}

export async function addUtterance(iv: InterviewRow, speaker: "expert" | "interviewer", text: string, timing?: { tStartMs: number; tEndMs: number }) {
  const now = Date.now() - iv.createdAt.getTime();
  const [row] = await db
    .insert(utterance)
    .values({
      interviewId: iv.id,
      speaker,
      text: text.trim(),
      seq: dsql`(SELECT COALESCE(MAX(seq), 0) + 1 FROM utterance WHERE interview_id = ${iv.id})`,
      tStartMs: timing?.tStartMs ?? now,
      tEndMs: timing?.tEndMs ?? now,
    })
    .returning();
  return row;
}

/** Streams the interviewer's next turn and stores it. */
export async function* interviewerTurn(iv: InterviewRow, opts: { voice?: boolean } = {}): AsyncGenerator<string, UtteranceRow> {
  const utts = await getUtterances(iv.id);
  const started = Date.now() - iv.createdAt.getTime();
  const text = yield* streamText({
    system: await interviewerSystem(iv, Boolean(opts.voice)),
    messages: buildMessages(iv, utts),
    effort: "low",
    fast: true,
    maxTokens: 600,
  });
  return addUtterance(iv, "interviewer", text, { tStartMs: started, tEndMs: Date.now() - iv.createdAt.getTime() });
}

const coverageSchema = z.object({
  coveredTopicIds: z.array(z.string()),
  doneChecklistIds: z.array(z.string()),
  newNotes: z.array(z.object({ topicId: z.string(), text: z.string() })),
});

/** Updates topic coverage, checklist, and live notes from the latest exchange. */
export async function updateCoverage(iv: InterviewRow): Promise<InterviewRow> {
  const utts = await getUtterances(iv.id);
  const recent = utts.slice(-4).map((u) => `${u.speaker === "expert" ? "EXPERT" : "INTERVIEWER"}: ${u.text}`).join("\n");
  const result = await structured({
    schema: coverageSchema,
    system: COVERAGE_SYSTEM,
    effort: "low",
    fast: true,
    maxTokens: 4000,
    messages: [
      {
        role: "user",
        content: `Topics:\n${iv.topics.map((t) => `${t.id}: ${t.label}${t.covered ? " (covered)" : ""}`).join("\n")}\n\nChecklist:\n${
          iv.checklist.map((c) => `${c.id}: ${c.text}${c.done ? " (done)" : ""}`).join("\n") || "none"
        }\n\nCurrent notes:\n${iv.notes.map((n) => `- ${n.text}`).join("\n") || "none"}\n\nLatest exchange:\n${recent}`,
      },
    ],
  });
  const topicIds = new Set(iv.topics.map((t) => t.id));
  const topics: Topic[] = iv.topics.map((t) => ({ ...t, covered: t.covered || result.coveredTopicIds.includes(t.id) }));
  const checklist = iv.checklist.map((c) => ({ ...c, done: c.done || result.doneChecklistIds.includes(c.id) }));
  const notes: Note[] = [
    ...iv.notes,
    ...result.newNotes.map((n) => ({ id: crypto.randomUUID().slice(0, 8), topicId: topicIds.has(n.topicId) ? n.topicId : null, text: n.text, byUser: false })),
  ];
  const [row] = await db.update(interview).set({ topics, checklist, notes }).where(eq(interview.id, iv.id)).returning();
  return row;
}

export function transcriptText(utts: UtteranceRow[]) {
  return utts.map((u) => `${u.speaker === "expert" ? "EXPERT" : "INTERVIEWER"}: ${u.text}`).join("\n");
}

export async function* generateDraft(iv: InterviewRow): AsyncGenerator<string, string> {
  const utts = await getUtterances(iv.id);
  const corrections = iv.notes.filter((n) => n.byUser).map((n) => `- ${n.text}`).join("\n");
  const md = yield* streamText({
    system: [DRAFT_SYSTEM, WRITING_RULES],
    effort: "medium",
    messages: [
      {
        role: "user",
        content: `Interview: ${iv.title} (${MODE_LABELS[iv.mode].label})\nGoal: ${iv.goal}\nTopics: ${iv.topics.map((t) => t.label).join("; ")}\n${
          corrections ? `Expert corrections (override the transcript):\n${corrections}\n` : ""
        }\nTranscript:\n${transcriptText(utts)}`,
      },
    ],
  });
  await db.update(interview).set({ draftMd: md, status: "ended" }).where(eq(interview.id, iv.id));
  return md;
}

/** Builds the immutable source text. Utterance char offsets are recomputed at ingest from the same format. */
export function sourceTextFrom(utts: UtteranceRow[]) {
  let text = "";
  const spans: { utteranceId: string; start: number; end: number; tStartMs: number; speaker: string }[] = [];
  for (const u of utts) {
    const prefix = `${u.speaker === "expert" ? "EXPERT" : "INTERVIEWER"}: `;
    const start = text.length + prefix.length;
    text += prefix + u.text + "\n";
    spans.push({ utteranceId: u.id, start, end: start + u.text.length, tStartMs: u.tStartMs, speaker: u.speaker });
  }
  return { text, spans };
}

export async function publishInterview(iv: InterviewRow, draftMd: string) {
  const utts = await getUtterances(iv.id);
  const { text } = sourceTextFrom(utts);
  const [src] = await db
    .insert(source)
    .values({ orgId: iv.orgId, kind: "interview", interviewId: iv.id, title: iv.title, expertName: iv.expertName, text })
    .returning();
  await db.update(interview).set({ draftMd, verified: true, status: "published" }).where(eq(interview.id, iv.id));
  return src;
}

export async function summarizeForTitle(text: string) {
  return (await completeText({ system: "Return a 3 to 6 word title for this conversation. No quotes, no punctuation at the end.", messages: [{ role: "user", content: text.slice(0, 2000) }], effort: "low", maxTokens: 200 })).trim();
}

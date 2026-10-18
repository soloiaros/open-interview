import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatMessage, chatThread } from "@/db/schema";
import type { Citation } from "@/db/app-schema";
import { summarizeForTitle } from "@/lib/interview";
import { streamText } from "@/lib/llm";
import { CHAT_SYSTEM } from "@/lib/prompts/wiki";
import { WRITING_RULES } from "@/lib/prompts/style";
import { numberSources, retrieve, usedCitations } from "@/lib/retrieval";

export const NO_ANSWER = "I don't have that in the wiki yet. Run an interview with the person who knows it, and I can answer next time.";

export async function* answer(opts: { orgId: string; userId: string; threadId?: string; question: string }): AsyncGenerator<
  { type: "thread"; threadId: string } | { type: "delta"; text: string },
  { text: string; citations: Citation[]; threadId: string }
> {
  let threadId = opts.threadId;
  if (!threadId) {
    const [t] = await db.insert(chatThread).values({ orgId: opts.orgId, userId: opts.userId, title: opts.question.slice(0, 60) }).returning();
    threadId = t.id;
    summarizeForTitle(opts.question).then((title) => db.update(chatThread).set({ title }).where(eq(chatThread.id, t.id))).catch(() => {});
  }
  yield { type: "thread", threadId };
  const history = await db.select().from(chatMessage).where(eq(chatMessage.threadId, threadId)).orderBy(asc(chatMessage.createdAt));
  await db.insert(chatMessage).values({ threadId, role: "user", content: opts.question });

  const lastTurns = history.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");
  const { pages, chunks } = await retrieve(opts.orgId, `${opts.question}\n${history.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join("\n")}`);
  let text = "";
  let citations: Citation[] = [];
  if (pages.length === 0 && chunks.length === 0) {
    text = NO_ANSWER;
    yield { type: "delta", text };
  } else {
    const numbered = numberSources(pages, chunks);
    const gen = streamText({
      system: [CHAT_SYSTEM, WRITING_RULES],
      effort: "low",
      maxTokens: 8000,
      messages: [
        {
          role: "user",
          content: `Sources:\n${numbered.context}\n\n${lastTurns ? `Conversation so far:\n${lastTurns}\n\n` : ""}Question: ${opts.question}`,
        },
      ],
    });
    for (let r = await gen.next(); !r.done; r = await gen.next()) {
      text += r.value;
      yield { type: "delta", text: r.value };
    }
    citations = usedCitations(text, numbered.citations);
  }
  await db.insert(chatMessage).values({ threadId, role: "assistant", content: text, citations });
  await db.update(chatThread).set({ updatedAt: new Date() }).where(eq(chatThread.id, threadId));
  return { text, citations, threadId };
}

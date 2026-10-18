import { and, eq, inArray, sql as dsql } from "drizzle-orm";
import { z } from "zod";
import { db, sql } from "@/db/client";
import { chunk, claim, evidence, ingestRun, link, page, pageRevision, source } from "@/db/schema";
import { PAGE_TYPES, type PageType } from "@/db/app-schema";
import { locateQuote } from "@/lib/grounding";
import { getSettings, getUtterances, sourceTextFrom } from "@/lib/interview";
import { completeText, structured } from "@/lib/llm";
import { CLAIMS_SYSTEM, HYBRID_APPEND_RULE, MERGE_SYSTEM, skeletonSystem, writePageSystem } from "@/lib/prompts/wiki";
import { WRITING_RULES } from "@/lib/prompts/style";
import { searchPages } from "@/lib/search";
import { slugify } from "@/lib/slug";

type Span = { utteranceId: string | null; start: number; end: number; tStartMs: number | null; speaker: string };
type Target = { existingId: string | null; slug: string; type: PageType; title: string; summary: string; tags: string[] };
type Grounded = { text: string; quote: string; start: number; end: number; utteranceId: string | null; tStartMs: number | null };

export const claimLabel = (claimId: string) => `c-${claimId.slice(0, 8)}`;

function limit(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= concurrency) await new Promise<void>((r) => queue.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

export const searchTextFor = (p: { title: string; summary: string; tags: string[]; bodyMd: string }) =>
  [p.title, p.summary, p.tags.join(" "), p.bodyMd.replace(/\[\^[^\]]+\]/g, "").replace(/[#*>\[\]`]/g, "")].join("\n");

export async function runIngest(sourceId: string) {
  const [src] = await db.select().from(source).where(eq(source.id, sourceId));
  if (!src) throw new Error(`source ${sourceId} not found`);
  const [run] = await db.insert(ingestRun).values({ orgId: src.orgId, sourceId, status: "running" }).returning();
  const log: string[] = [];
  const stats = { pagesCreated: 0, pagesUpdated: 0, claimsAdded: 0, claimsSupported: 0, claimsSuperseded: 0, claimsContested: 0, quotesRejected: 0 };
  const settings = await getSettings(src.orgId);

  try {
    // 1. Spans and chunks. Interview sources carry utterance timestamps.
    let spans: Span[] = [{ utteranceId: null, start: 0, end: src.text.length, tStartMs: null, speaker: "expert" }];
    if (src.interviewId) {
      const built = sourceTextFrom(await getUtterances(src.interviewId));
      if (built.text === src.text) spans = built.spans;
    }
    await writeChunks(src, spans);

    // 2. Plan which pages this source touches.
    const index = await pageIndex(src.orgId, src.title + "\n" + src.text.slice(0, 4000));
    const plan = await structured({
      schema: z.object({
        pages: z.array(
          z.object({
            existingSlug: z.string().nullable(),
            type: z.enum(PAGE_TYPES),
            title: z.string(),
            summary: z.string(),
            tags: z.array(z.string()),
          }),
        ),
      }),
      system: skeletonSystem(settings.wikiSchema),
      effort: "medium",
      messages: [
        {
          role: "user",
          content: `Existing wiki index (slug | type | title | summary):\n${index.map((p) => `${p.slug} | ${p.type} | ${p.title} | ${p.summary}`).join("\n") || "(empty wiki)"}\n\nNew source: ${src.title}${src.expertName ? ` (expert: ${src.expertName})` : ""}\n${src.text}`,
        },
      ],
    });
    const bySlug = new Map(index.map((p) => [p.slug, p]));
    const targets: Target[] = [];
    const seen = new Set<string>();
    for (const p of plan.pages) {
      const existing = p.existingSlug ? bySlug.get(p.existingSlug) : undefined;
      const slug = existing?.slug ?? slugify(p.title);
      if (seen.has(slug)) continue;
      seen.add(slug);
      targets.push({ existingId: existing?.id ?? null, slug, type: existing?.type ?? p.type, title: existing?.title ?? p.title, summary: p.summary.slice(0, 160), tags: p.tags.map(slugify).slice(0, 6) });
    }
    log.push(`planned ${targets.length} pages`);

    // 3. Grounded claims. Every quote must match an expert line in the source.
    const expertSpans = spans.filter((s) => s.speaker === "expert");
    const groundedByTarget = new Map<number, Grounded[]>();
    const run3 = limit(4);
    const batches: number[][] = [];
    for (let i = 0; i < targets.length; i += 4) batches.push([...Array(Math.min(4, targets.length - i)).keys()].map((k) => i + k));
    await Promise.all(
      batches.map((batch) =>
        run3(async () => {
          const out = await structured({
            schema: z.object({ pages: z.array(z.object({ page: z.number().int(), claims: z.array(z.object({ text: z.string(), quote: z.string() })) })) }),
            system: CLAIMS_SYSTEM,
            effort: "medium",
            messages: [
              {
                role: "user",
                content: `Target pages:\n${batch.map((i) => `${i}: [${targets[i].type}] ${targets[i].title} - ${targets[i].summary}`).join("\n")}\n\nSource:\n${src.text}`,
              },
            ],
          });
          for (const p of out.pages) {
            if (!batch.includes(p.page)) continue;
            const list = groundedByTarget.get(p.page) ?? [];
            for (const c of p.claims) {
              const loc = locateQuote(src.text, c.quote);
              const span = loc && expertSpans.find((s) => loc.start >= s.start - 2 && loc.end <= s.end + 2);
              if (!loc || !span) {
                stats.quotesRejected++;
                continue;
              }
              list.push({ text: c.text, quote: src.text.slice(loc.start, loc.end), start: loc.start, end: loc.end, utteranceId: span.utteranceId, tStartMs: span.tStartMs });
            }
            groundedByTarget.set(p.page, list);
          }
        }),
      ),
    );

    // 4-6. Merge claims and rewrite each touched page.
    const linkable = [...new Set([...index.map((p) => p.title), ...targets.map((t) => t.title)])];
    const touched: string[] = [];
    const run4 = limit(4);
    await Promise.all(
      targets.map((t, i) =>
        run4(async () => {
          const grounded = groundedByTarget.get(i) ?? [];
          if (grounded.length === 0) return;
          const pageId = await upsertPage(src.orgId, t, stats);
          const [current] = await db.select().from(page).where(eq(page.id, pageId));
          await mergeClaims(pageId, src.id, grounded, stats);
          if (current.editMode === "human_locked") {
            log.push(`${t.slug}: locked, evidence attached only`);
            return;
          }
          await rewritePage(current, t, linkable, settings.wikiSchema, src.id);
          touched.push(pageId);
        }),
      ),
    );

    // 7. Links for touched pages.
    await relink(src.orgId, touched);

    await db.update(ingestRun).set({ status: "done", stats, log: log.join("\n") }).where(eq(ingestRun.id, run.id));
    return stats;
  } catch (err) {
    log.push(String(err instanceof Error ? err.stack : err));
    await db.update(ingestRun).set({ status: "failed", stats, log: log.join("\n") }).where(eq(ingestRun.id, run.id));
    throw err;
  }
}

async function writeChunks(src: typeof source.$inferSelect, spans: Span[]) {
  await db.delete(chunk).where(eq(chunk.sourceId, src.id));
  const rows: (typeof chunk.$inferInsert)[] = [];
  let cur: { start: number; end: number; t: number | null } | null = null;
  for (const s of spans) {
    const lineStart = src.text.lastIndexOf("\n", s.start) + 1;
    if (!cur) cur = { start: lineStart, end: s.end, t: s.tStartMs };
    else cur.end = s.end;
    if (cur.end - cur.start > 1200) {
      rows.push({ orgId: src.orgId, sourceId: src.id, text: src.text.slice(cur.start, cur.end), charStart: cur.start, charEnd: cur.end, tStartMs: cur.t });
      cur = null;
    }
  }
  if (cur) rows.push({ orgId: src.orgId, sourceId: src.id, text: src.text.slice(cur.start, cur.end), charStart: cur.start, charEnd: cur.end, tStartMs: cur.t });
  if (!rows.length) return;
  await db.insert(chunk).values(rows);
}

/** The index the planner reads. Whole wiki while small; BM25 shortlist once it grows. */
async function pageIndex(orgId: string, query: string) {
  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM page WHERE org_id = ${orgId}`;
  if (count <= 200)
    return db.select({ id: page.id, slug: page.slug, type: page.type, title: page.title, summary: page.summary }).from(page).where(eq(page.orgId, orgId));
  // Large wiki: shortlist by full-text overlap with the new source.
  const hits = await searchPages(orgId, query.slice(0, 2000), 120);
  return hits.map((h) => ({ id: h.id, slug: h.slug, type: h.type as PageType, title: h.title, summary: h.summary }));
}

async function upsertPage(orgId: string, t: Target, stats: Record<string, number>) {
  if (t.existingId) {
    stats.pagesUpdated++;
    return t.existingId;
  }
  const [row] = await db
    .insert(page)
    .values({ orgId, slug: t.slug, type: t.type, title: t.title, summary: t.summary, tags: t.tags, version: 0 })
    .onConflictDoUpdate({ target: [page.orgId, page.slug], set: { updatedAt: new Date() } })
    .returning({ id: page.id, version: page.version });
  if (row.version === 0) stats.pagesCreated++;
  else stats.pagesUpdated++;
  return row.id;
}

async function mergeClaims(pageId: string, sourceId: string, grounded: Grounded[], stats: Record<string, number>) {
  const existing = await db.select().from(claim).where(and(eq(claim.pageId, pageId), inArray(claim.status, ["active", "contested"])));
  const addEvidence = (claimId: string, g: Grounded, stance: "supports" | "contradicts" = "supports") =>
    db.insert(evidence).values({ claimId, sourceId, utteranceId: g.utteranceId, quote: g.quote, charStart: g.start, charEnd: g.end, tStartMs: g.tStartMs, stance });
  const insertClaim = async (g: Grounded, status: "active" | "contested" = "active") => {
    const [c] = await db.insert(claim).values({ pageId, text: g.text, status }).returning({ id: claim.id });
    await addEvidence(c.id, g);
    return c.id;
  };

  if (existing.length === 0) {
    for (const g of grounded) await insertClaim(g);
    stats.claimsAdded += grounded.length;
    return;
  }
  const decisions = await structured({
    schema: z.object({
      decisions: z.array(z.object({ newClaim: z.number().int(), action: z.enum(["add", "support", "supersede", "contradict", "noop"]), existingClaimId: z.string().nullable() })),
    }),
    system: MERGE_SYSTEM,
    effort: "low",
    messages: [
      {
        role: "user",
        content: `Existing claims:\n${existing.map((c) => `${c.id}: ${c.text}`).join("\n")}\n\nNew claims:\n${grounded.map((g, i) => `${i}: ${g.text}`).join("\n")}`,
      },
    ],
  });
  const known = new Set(existing.map((c) => c.id));
  const handled = new Set<number>();
  for (const d of decisions.decisions) {
    const g = grounded[d.newClaim];
    if (!g || handled.has(d.newClaim)) continue;
    handled.add(d.newClaim);
    const target = d.existingClaimId && known.has(d.existingClaimId) ? d.existingClaimId : null;
    if (d.action === "noop") continue;
    if (d.action === "support" && target) {
      await addEvidence(target, g);
      stats.claimsSupported++;
    } else if (d.action === "supersede" && target) {
      const newId = await insertClaim(g);
      await db.update(claim).set({ status: "superseded", supersededBy: newId }).where(eq(claim.id, target));
      stats.claimsSuperseded++;
    } else if (d.action === "contradict" && target) {
      await insertClaim(g, "contested");
      await db.update(claim).set({ status: "contested" }).where(eq(claim.id, target));
      stats.claimsContested++;
    } else {
      await insertClaim(g);
      stats.claimsAdded++;
    }
  }
  for (let i = 0; i < grounded.length; i++)
    if (!handled.has(i)) {
      await insertClaim(grounded[i]);
      stats.claimsAdded++;
    }
}

async function rewritePage(current: typeof page.$inferSelect, t: Target, linkable: string[], wikiSchema: string, sourceId: string) {
  const claims = await db.select().from(claim).where(and(eq(claim.pageId, current.id), inArray(claim.status, ["active", "contested"])));
  const body = await completeText({
    system: [writePageSystem(current.type, wikiSchema), WRITING_RULES],
    effort: "medium",
    messages: [
      {
        role: "user",
        content: `Page: ${current.title} (${current.type})\n\n${current.bodyMd ? `Existing body:\n${current.bodyMd}\n\n` : ""}Claims (cite as [^<label>]):\n${claims
          .map((c) => `${claimLabel(c.id)}${c.status === "contested" ? " (contested)" : ""}: ${c.text}`)
          .join("\n")}\n\nTitles you may link with [[...]]:\n${linkable.filter((x) => x !== current.title).join("\n")}${current.editMode === "hybrid" && current.bodyMd ? `\n\n${HYBRID_APPEND_RULE}` : ""}`,
      },
    ],
  });
  const version = current.version + 1;
  const summary = current.summary || t.summary;
  const tags = current.tags.length ? current.tags : t.tags;
  await db
    .update(page)
    .set({ bodyMd: body.trim(), version, summary, tags, searchText: searchTextFor({ title: current.title, summary, tags, bodyMd: body }) })
    .where(eq(page.id, current.id));
  await db.insert(pageRevision).values({ pageId: current.id, version, bodyMd: body.trim(), author: "llm", sourceId });
}

/** Rebuilds outgoing links from [[Title]] mentions. */
export async function relink(orgId: string, pageIds: string[]) {
  if (!pageIds.length) return;
  const all = await db.select({ id: page.id, title: page.title, bodyMd: page.bodyMd }).from(page).where(eq(page.orgId, orgId));
  const byTitle = new Map(all.map((p) => [p.title.toLowerCase(), p.id]));
  for (const p of all.filter((x) => pageIds.includes(x.id))) {
    const targets = new Set<string>();
    for (const m of p.bodyMd.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) {
      const id = byTitle.get(m[1].trim().toLowerCase());
      if (id && id !== p.id) targets.add(id);
    }
    await db.delete(link).where(eq(link.fromPageId, p.id));
    if (targets.size) await db.insert(link).values([...targets].map((toPageId) => ({ fromPageId: p.id, toPageId }))).onConflictDoNothing();
  }
}


/** Used after a human edit: refresh search text, revision, links. */
export async function afterHumanEdit(pageId: string, userId: string) {
  const [p] = await db.select().from(page).where(eq(page.id, pageId));
  await db.update(page).set({ searchText: searchTextFor(p), version: dsql`${page.version} + 1` }).where(eq(page.id, pageId));
  await db.insert(pageRevision).values({ pageId, version: p.version + 1, bodyMd: p.bodyMd, author: userId });
  await relink(p.orgId, [pageId]);
}

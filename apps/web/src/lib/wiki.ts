import { and, asc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { claim, evidence, link, page, pageRevision, source } from "@/db/schema";
import type { ClaimRef } from "@/components/wiki-markdown";
import { claimLabel } from "@/lib/ingest";

export async function getPageView(orgId: string, slug: string) {
  const [p] = await db.select().from(page).where(and(eq(page.orgId, orgId), eq(page.slug, slug)));
  if (!p) return null;

  const claims = await db.select().from(claim).where(eq(claim.pageId, p.id));
  const ev = claims.length
    ? await db
        .select({
          claimId: evidence.claimId,
          quote: evidence.quote,
          tStartMs: evidence.tStartMs,
          utteranceId: evidence.utteranceId,
          stance: evidence.stance,
          sourceId: source.id,
          sourceTitle: source.title,
          expert: source.expertName,
          interviewId: source.interviewId,
        })
        .from(evidence)
        .innerJoin(source, eq(evidence.sourceId, source.id))
        .where(inArray(evidence.claimId, claims.map((c) => c.id)))
        .orderBy(asc(evidence.createdAt))
    : [];

  const refs: Record<string, ClaimRef> = {};
  for (const c of claims) {
    const list = ev.filter((e) => e.claimId === c.id);
    const first = list[0];
    if (!first) continue;
    refs[claimLabel(c.id)] = {
      label: claimLabel(c.id),
      title: first.sourceTitle,
      quote: first.quote,
      expert: first.expert,
      interviewId: first.interviewId,
      tStartMs: first.tStartMs,
      utteranceId: first.utteranceId,
      count: new Set(list.map((e) => e.sourceId)).size,
    };
  }

  const sources = [...new Map(ev.map((e) => [e.sourceId, { id: e.sourceId, title: e.sourceTitle, expert: e.expert, interviewId: e.interviewId }])).values()];
  const contested = claims.filter((c) => c.status === "contested");

  const all = await db.select({ id: page.id, title: page.title, slug: page.slug, type: page.type }).from(page).where(eq(page.orgId, orgId));
  const titles = Object.fromEntries(all.map((x) => [x.title.toLowerCase(), x.slug]));
  const links = await db.select().from(link).where(or(eq(link.fromPageId, p.id), eq(link.toPageId, p.id)));
  const byId = new Map(all.map((x) => [x.id, x]));
  const outgoing = links.filter((l) => l.fromPageId === p.id).map((l) => byId.get(l.toPageId)).filter(Boolean);
  const backlinks = links.filter((l) => l.toPageId === p.id).map((l) => byId.get(l.fromPageId)).filter(Boolean);
  const revisions = await db.select({ version: pageRevision.version, author: pageRevision.author, createdAt: pageRevision.createdAt }).from(pageRevision).where(eq(pageRevision.pageId, p.id)).orderBy(asc(pageRevision.version));

  return { page: p, refs, titles, sources, contested, outgoing, backlinks, revisions };
}

export type PageView = NonNullable<Awaited<ReturnType<typeof getPageView>>>;


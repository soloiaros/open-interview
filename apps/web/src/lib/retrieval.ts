import { inArray, and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { page } from "@/db/schema";
import type { Citation } from "@/db/app-schema";
import { searchAll, type ChunkHit, type PageHit } from "@/lib/search";

const stripMarkers = (md: string) => md.replace(/\s?\[\^[^\]]+\]/g, "");
const clock = (ms: number | null) => (ms == null ? "" : `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`);

/** Numbers retrieved pages and transcript excerpts as [1..n] for the model, and keeps the map for the UI. */
export function numberSources(pages: PageHit[], chunks: ChunkHit[], pageChars = 3000) {
  const citations: Citation[] = [];
  const blocks: string[] = [];
  for (const p of pages) {
    const n = citations.length + 1;
    citations.push({ n, kind: "page", slug: p.slug, title: p.title });
    blocks.push(`[${n}] Wiki page "${p.title}" (${p.type})\n${p.summary}\n${stripMarkers(p.bodyMd).slice(0, pageChars)}`);
  }
  for (const c of chunks) {
    const n = citations.length + 1;
    citations.push({ n, kind: "evidence", slug: "", title: c.title, interviewId: c.interviewId, tStartMs: c.tStartMs, quote: c.text.slice(0, 280) });
    blocks.push(`[${n}] Interview transcript "${c.title}"${c.tStartMs != null ? ` at ${clock(c.tStartMs)}` : ""}\n${c.text}`);
  }
  return { citations, context: blocks.join("\n\n---\n\n") };
}

export async function retrieve(orgId: string, query: string, opts: { pageIds?: string[]; pages?: number; chunks?: number } = {}) {
  if (opts.pageIds?.length) {
    const pages = await db
      .select({ id: page.id, slug: page.slug, title: page.title, type: page.type, summary: page.summary, bodyMd: page.bodyMd })
      .from(page)
      .where(and(eq(page.orgId, orgId), inArray(page.id, opts.pageIds)));
    const { chunks } = await searchAll(orgId, query, { pages: 0, chunks: opts.chunks ?? 4 });
    return { pages, chunks };
  }
  return searchAll(orgId, query, { pages: opts.pages, chunks: opts.chunks });
}

/** Keeps only citations the answer actually used. */
export function usedCitations(text: string, citations: Citation[]) {
  const used = new Set([...text.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)].flatMap((m) => m[1].split(",").map((x) => Number(x.trim()))));
  return citations.filter((c) => used.has(c.n));
}

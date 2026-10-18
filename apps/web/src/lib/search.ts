import { sql } from "@/db/client";

export type PageHit = { id: string; slug: string; title: string; type: string; summary: string; bodyMd: string };
export type ChunkHit = { id: string; sourceId: string; text: string; tStartMs: number | null; interviewId: string | null; title: string };

// Built-in Postgres full-text search, ranked with ts_rank_cd. OR-matching keeps natural-language questions useful:
// "who signs off supplier changes" matches pages with any of the content words, best overlap first.
const orQuery = (q: string) =>
  q
    .toLowerCase()
    .match(/[a-z0-9]{2,}/g)
    ?.slice(0, 24)
    .join(" | ") ?? "";

export async function searchPages(orgId: string, query: string, limit = 8): Promise<PageHit[]> {
  const q = orQuery(query);
  if (!q) return [];
  return sql<PageHit[]>`
    SELECT id, slug, title, type, summary, body_md AS "bodyMd"
    FROM page, to_tsquery('english', ${q}) query
    WHERE org_id = ${orgId} AND to_tsvector('english', search_text) @@ query
    ORDER BY ts_rank_cd(to_tsvector('english', search_text), query) DESC
    LIMIT ${limit}`;
}

export async function searchChunks(orgId: string, query: string, limit = 6): Promise<ChunkHit[]> {
  const q = orQuery(query);
  if (!q) return [];
  return sql<ChunkHit[]>`
    SELECT c.id, c.source_id AS "sourceId", c.text, c.t_start_ms AS "tStartMs", s.interview_id AS "interviewId", s.title
    FROM chunk c JOIN source s ON s.id = c.source_id, to_tsquery('english', ${q}) query
    WHERE c.org_id = ${orgId} AND to_tsvector('english', c.text) @@ query
    ORDER BY ts_rank_cd(to_tsvector('english', c.text), query) DESC
    LIMIT ${limit}`;
}

export async function searchAll(orgId: string, query: string, opts: { pages?: number; chunks?: number } = {}) {
  const [pages, chunks] = await Promise.all([
    opts.pages === 0 ? Promise.resolve([]) : searchPages(orgId, query, opts.pages ?? 8),
    searchChunks(orgId, query, opts.chunks ?? 6),
  ]);
  return { pages, chunks };
}

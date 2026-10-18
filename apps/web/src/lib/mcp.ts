import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { orgSettings, page } from "@/db/schema";
import { DOCUMENT_TYPES, PAGE_TYPES } from "@/db/app-schema";
import { NO_ANSWER } from "@/lib/chat";
import { generateDocument } from "@/lib/create";
import { completeText } from "@/lib/llm";
import { CHAT_SYSTEM } from "@/lib/prompts/wiki";
import { WRITING_RULES } from "@/lib/prompts/style";
import { numberSources, retrieve, usedCitations } from "@/lib/retrieval";
import { searchPages } from "@/lib/search";
import { hashKey } from "@/lib/secrets";

export async function orgFromApiKey(header: string | null): Promise<string | null> {
  const key = header?.replace(/^Bearer\s+/i, "").trim();
  if (!key) return null;
  const [row] = await db.select({ orgId: orgSettings.orgId }).from(orgSettings).where(eq(orgSettings.apiKeyHash, hashKey(key)));
  return row?.orgId ?? null;
}

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

/** One server per request (stateless). Tools are read-only except create_document, which returns text and stores nothing. */
export function buildMcpServer(orgId: string) {
  const server = new McpServer({ name: "tacivo-wiki", version: "1.0.0" });

  server.registerTool(
    "search_wiki",
    { description: "Keyword search over the team wiki. Returns matching page slugs, titles, types, and summaries.", inputSchema: { query: z.string(), limit: z.number().int().min(1).max(25).optional() } },
    async ({ query, limit }) => {
      const hits = await searchPages(orgId, query, limit ?? 10);
      return text(hits.map((h) => `${h.slug} | ${h.type} | ${h.title} | ${h.summary}`).join("\n") || "No matches.");
    },
  );

  server.registerTool(
    "get_page",
    { description: "Full markdown of one wiki page by slug. Citation markers like [^c-1a2b3c4d] point to interview evidence.", inputSchema: { slug: z.string() } },
    async ({ slug }) => {
      const [p] = await db.select().from(page).where(and(eq(page.orgId, orgId), eq(page.slug, slug)));
      return text(p ? `# ${p.title}\nType: ${p.type} | Version ${p.version} | Tags: ${p.tags.join(", ")}\n\n${p.bodyMd}` : `No page with slug "${slug}".`);
    },
  );

  server.registerTool(
    "list_pages",
    { description: "Lists wiki pages, optionally filtered by type.", inputSchema: { type: z.enum(PAGE_TYPES).optional() } },
    async ({ type }) => {
      const rows = await db
        .select({ slug: page.slug, type: page.type, title: page.title, summary: page.summary })
        .from(page)
        .where(type ? and(eq(page.orgId, orgId), eq(page.type, type)) : eq(page.orgId, orgId))
        .orderBy(asc(page.title));
      return text(rows.map((r) => `${r.slug} | ${r.type} | ${r.title} | ${r.summary}`).join("\n") || "The wiki is empty.");
    },
  );

  server.registerTool(
    "ask",
    { description: "Answers a question from the wiki and interview transcripts, with numbered sources. Refuses when the wiki has no answer.", inputSchema: { question: z.string() } },
    async ({ question }) => {
      const { pages, chunks } = await retrieve(orgId, question);
      if (!pages.length && !chunks.length) return text(NO_ANSWER);
      const numbered = numberSources(pages, chunks);
      const answer = await completeText({ system: [CHAT_SYSTEM, WRITING_RULES], effort: "low", maxTokens: 8000, messages: [{ role: "user", content: `Sources:\n${numbered.context}\n\nQuestion: ${question}` }] });
      const used = usedCitations(answer, numbered.citations);
      return text(`${answer}\n\nSources:\n${used.map((c) => `[${c.n}] ${c.title}${c.kind === "page" ? ` (page: ${c.slug})` : ""}`).join("\n")}`);
    },
  );

  server.registerTool(
    "create_document",
    { description: "Drafts a handover, SOP, onboarding guide, training module, or decision tree from the wiki. Returns markdown.", inputSchema: { type: z.enum(DOCUMENT_TYPES), brief: z.string() } },
    async ({ type, brief }) => {
      const gen = generateDocument({ orgId, type, brief });
      let r = await gen.next();
      while (!r.done) r = await gen.next();
      return text(r.value.text);
    },
  );

  return server;
}

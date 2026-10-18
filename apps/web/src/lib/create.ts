import type { DocumentType } from "@/db/app-schema";
import { streamText } from "@/lib/llm";
import { createSystem } from "@/lib/prompts/wiki";
import { WRITING_RULES } from "@/lib/prompts/style";
import { numberSources, retrieve } from "@/lib/retrieval";

export async function* generateDocument(opts: { orgId: string; type: DocumentType; brief: string; pageIds?: string[] }) {
  const { pages, chunks } = await retrieve(opts.orgId, opts.brief, { pageIds: opts.pageIds, pages: 12, chunks: 6 });
  const { citations, context } = numberSources(pages, chunks, 6000);
  const text = yield* streamText({
    system: [createSystem(opts.type), WRITING_RULES],
    effort: "medium",
    messages: [{ role: "user", content: `Brief: ${opts.brief}\n\nSources:\n${context || "(the wiki has nothing on this yet)"}` }],
  });
  return { text, citations, pageIds: pages.map((p) => p.id) };
}

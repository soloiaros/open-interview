import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { chatMessage, chatThread, page } from "@/db/schema";
import { apiContext } from "@/lib/context";
import { searchTextFor } from "@/lib/ingest";
import { summarizeForTitle } from "@/lib/interview";
import { slugify } from "@/lib/slug";

// Files a good answer back into the wiki as an insight page, marked for review.
export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { messageId } = z.object({ messageId: z.string() }).parse(await req.json());
  const [m] = await db
    .select({ content: chatMessage.content, citations: chatMessage.citations })
    .from(chatMessage)
    .innerJoin(chatThread, eq(chatMessage.threadId, chatThread.id))
    .where(and(eq(chatMessage.id, messageId), eq(chatThread.orgId, ctx.orgId)));
  if (!m) return Response.json({ error: "Not found." }, { status: 404 });
  const title = await summarizeForTitle(m.content);
  const sources = m.citations.map((c) => `- [${c.n}] ${c.kind === "page" ? `[[${c.title}]]` : c.title}`).join("\n");
  const bodyMd = `${m.content}\n\n## Sources\n${sources}`;
  const [row] = await db
    .insert(page)
    .values({ orgId: ctx.orgId, slug: `${slugify(title)}-${crypto.randomUUID().slice(0, 4)}`, type: "insight", title, summary: m.content.slice(0, 140), bodyMd, status: "needs_review", searchText: searchTextFor({ title, summary: "", tags: [], bodyMd }) })
    .returning();
  return Response.json({ slug: row.slug });
}

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { document } from "@/db/schema";
import { apiContext } from "@/lib/context";
import { markdownToDocx } from "@/lib/export-docx";
import { slugify } from "@/lib/slug";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const [doc] = await db.select().from(document).where(and(eq(document.id, id), eq(document.orgId, ctx.orgId)));
  if (!doc) return Response.json({ error: "Not found." }, { status: 404 });
  const format = new URL(req.url).searchParams.get("format") ?? "md";
  const name = slugify(doc.title);
  if (format === "docx") {
    const buf = await markdownToDocx(doc.bodyMd, doc.citations);
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${name}.docx"`,
      },
    });
  }
  const sources = doc.citations.length ? `\n\n## Sources\n${doc.citations.map((c) => `- [${c.n}] ${c.title}`).join("\n")}\n` : "";
  return new Response(doc.bodyMd + sources, { headers: { "content-type": "text/markdown; charset=utf-8", "content-disposition": `attachment; filename="${name}.md"` } });
}

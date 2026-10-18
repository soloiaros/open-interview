import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { document } from "@/db/schema";
import { apiContext } from "@/lib/context";
import { getSettings } from "@/lib/interview";
import { exportToNotion } from "@/lib/notion";
import { decrypt } from "@/lib/secrets";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const [doc] = await db.select().from(document).where(and(eq(document.id, id), eq(document.orgId, ctx.orgId)));
  if (!doc) return Response.json({ error: "Not found." }, { status: 404 });
  const s = await getSettings(ctx.orgId);
  if (!s.notionTokenEnc || !s.notionParentPageId) return Response.json({ error: "Connect Notion in Settings first." }, { status: 400 });
  try {
    const url = await exportToNotion({ token: decrypt(s.notionTokenEnc), parentPageId: s.notionParentPageId, title: doc.title, markdown: doc.bodyMd });
    return Response.json({ url });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Notion export failed." }, { status: 502 });
  }
}

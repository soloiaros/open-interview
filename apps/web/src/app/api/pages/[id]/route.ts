import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { page } from "@/db/schema";
import { apiContext } from "@/lib/context";
import { afterHumanEdit } from "@/lib/ingest";

const body = z.object({
  title: z.string().min(1).max(140).optional(),
  summary: z.string().max(200).optional(),
  bodyMd: z.string().max(200000).optional(),
  editMode: z.enum(["llm_managed", "hybrid", "human_locked"]).optional(),
  status: z.enum(["published", "needs_review"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const patch = body.parse(await req.json());
  const [row] = await db.update(page).set(patch).where(and(eq(page.id, id), eq(page.orgId, ctx.orgId))).returning({ id: page.id });
  if (!row) return Response.json({ error: "Not found." }, { status: 404 });
  if (patch.bodyMd !== undefined || patch.title !== undefined) await afterHumanEdit(id, ctx.userId);
  return Response.json({ ok: true });
}

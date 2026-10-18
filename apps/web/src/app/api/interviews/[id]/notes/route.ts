import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { interview } from "@/db/schema";
import { apiContext } from "@/lib/context";
import { getInterview } from "@/lib/interview";

const note = z.object({ id: z.string(), topicId: z.string().nullable(), text: z.string().max(1000), byUser: z.boolean() });

// The expert edits or adds notes. Edited notes become corrections that outrank the transcript.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) return Response.json({ error: "Not found." }, { status: 404 });
  const { notes } = z.object({ notes: z.array(note).max(300) }).parse(await req.json());
  await db.update(interview).set({ notes }).where(eq(interview.id, id));
  return Response.json({ ok: true });
}

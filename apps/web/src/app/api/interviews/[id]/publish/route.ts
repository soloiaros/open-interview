import { z } from "zod";
import { apiContext } from "@/lib/context";
import { getInterview, publishInterview } from "@/lib/interview";
import { enqueueIngest } from "@/lib/queue";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) return Response.json({ error: "Not found." }, { status: 404 });
  const { draftMd, verified } = z.object({ draftMd: z.string().min(1), verified: z.literal(true) }).parse(await req.json());
  if (!verified) return Response.json({ error: "Confirm the draft first." }, { status: 400 });
  if (iv.status === "published") return Response.json({ error: "Already published." }, { status: 409 });
  const src = await publishInterview(iv, draftMd);
  await enqueueIngest(src.id);
  return Response.json({ sourceId: src.id });
}

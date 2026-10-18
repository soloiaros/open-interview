import { apiContext } from "@/lib/context";
import { generateDraft, getInterview } from "@/lib/interview";
import { ndjsonResponse } from "@/lib/ndjson";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) return Response.json({ error: "Not found." }, { status: 404 });
  return ndjsonResponse(async (send) => {
    const gen = generateDraft(iv);
    let r = await gen.next();
    for (; !r.done; r = await gen.next()) send({ type: "delta", text: r.value });
    send({ type: "done" });
  });
}

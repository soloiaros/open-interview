import { apiContext } from "@/lib/context";
import { getInterview, getUtterances } from "@/lib/interview";

// Polled by the voice screen to refresh transcript, coverage, and notes.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ interview: iv, utterances: await getUtterances(id) });
}

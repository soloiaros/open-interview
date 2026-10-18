import { z } from "zod";
import { apiContext } from "@/lib/context";
import { addUtterance, getInterview, interviewerTurn, updateCoverage } from "@/lib/interview";
import { ndjsonResponse } from "@/lib/ndjson";

// Text-mode turn: store the expert's answer (if any), stream the interviewer's reply, then refresh coverage.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) return Response.json({ error: "Not found." }, { status: 404 });
  if (iv.status !== "live") return Response.json({ error: "This interview has ended." }, { status: 409 });
  const { text } = z.object({ text: z.string().max(8000).optional() }).parse(await req.json());

  return ndjsonResponse(async (send) => {
    if (text?.trim()) send({ type: "expert", utterance: await addUtterance(iv, "expert", text) });
    const gen = interviewerTurn(iv);
    let r = await gen.next();
    for (; !r.done; r = await gen.next()) send({ type: "delta", text: r.value });
    send({ type: "interviewer", utterance: r.value });
    if (text?.trim()) {
      const updated = await updateCoverage(iv);
      send({ type: "state", topics: updated.topics, notes: updated.notes, checklist: updated.checklist });
    }
  });
}

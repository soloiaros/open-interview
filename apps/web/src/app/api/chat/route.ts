import { z } from "zod";
import { answer } from "@/lib/chat";
import { apiContext } from "@/lib/context";
import { ndjsonResponse } from "@/lib/ndjson";

export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { question, threadId } = z.object({ question: z.string().min(1).max(4000), threadId: z.string().optional() }).parse(await req.json());
  return ndjsonResponse(async (send) => {
    const gen = answer({ orgId: ctx.orgId, userId: ctx.userId, threadId, question });
    let r = await gen.next();
    for (; !r.done; r = await gen.next()) send(r.value);
    send({ type: "done", citations: r.value.citations, threadId: r.value.threadId });
  });
}

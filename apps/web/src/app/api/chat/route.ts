import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatThread } from "@/db/schema";
import { answer } from "@/lib/chat";
import { apiContext } from "@/lib/context";
import { ndjsonResponse } from "@/lib/ndjson";

export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const parsed = z.object({ question: z.string().min(1).max(4000), threadId: z.string().min(1).optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a question." }, { status: 400 });
  const { question, threadId } = parsed.data;
  if (threadId) {
    const [thread] = await db.select({ id: chatThread.id }).from(chatThread).where(
      and(eq(chatThread.id, threadId), eq(chatThread.orgId, ctx.orgId), eq(chatThread.userId, ctx.userId)),
    );
    if (!thread) return Response.json({ error: "Not found." }, { status: 404 });
  }
  return ndjsonResponse(async (send) => {
    const gen = answer({ orgId: ctx.orgId, userId: ctx.userId, threadId, question });
    let r = await gen.next();
    for (; !r.done; r = await gen.next()) send(r.value);
    send({ type: "done", citations: r.value.citations, threadId: r.value.threadId });
  });
}

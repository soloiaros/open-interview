import { z } from "zod";
import { db } from "@/db/client";
import { document } from "@/db/schema";
import { DOCUMENT_TYPES } from "@/db/app-schema";
import { apiContext } from "@/lib/context";
import { generateDocument } from "@/lib/create";
import { ndjsonResponse } from "@/lib/ndjson";

export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const input = z.object({ type: z.enum(DOCUMENT_TYPES), brief: z.string().min(3).max(2000), pageIds: z.array(z.string()).max(30).optional() }).parse(await req.json());
  return ndjsonResponse(async (send) => {
    const gen = generateDocument({ orgId: ctx.orgId, ...input });
    let r = await gen.next();
    for (; !r.done; r = await gen.next()) send({ type: "delta", text: r.value });
    const title = r.value.text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? input.brief.slice(0, 80);
    const [row] = await db
      .insert(document)
      .values({ orgId: ctx.orgId, createdBy: ctx.userId, type: input.type, title, brief: input.brief, bodyMd: r.value.text, pageIds: r.value.pageIds, citations: r.value.citations })
      .returning({ id: document.id });
    send({ type: "done", id: row.id, citations: r.value.citations });
  });
}

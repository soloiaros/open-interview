import { z } from "zod";
import { db } from "@/db/client";
import { orgSettings } from "@/db/schema";
import { apiContext } from "@/lib/context";
import { encrypt } from "@/lib/secrets";

const body = z.object({
  wikiSchema: z.string().max(8000).optional(),
  interviewerNotes: z.string().max(8000).optional(),
  glossary: z.string().max(8000).optional(),
  notionToken: z.string().max(500).optional(),
  notionParentPageId: z.string().max(100).optional(),
});

export async function PATCH(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { notionToken, ...rest } = body.parse(await req.json());
  const values = { ...rest, ...(notionToken ? { notionTokenEnc: encrypt(notionToken) } : {}) };
  await db.insert(orgSettings).values({ orgId: ctx.orgId, ...values }).onConflictDoUpdate({ target: orgSettings.orgId, set: values });
  return Response.json({ ok: true });
}

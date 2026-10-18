import { z } from "zod";
import { INTERVIEW_MODES } from "@/db/app-schema";
import { apiContext } from "@/lib/context";
import { createInterview } from "@/lib/interview";

const body = z.object({
  mode: z.enum(INTERVIEW_MODES),
  title: z.string().min(2).max(140),
  area: z.string().max(80).default(""),
  goal: z.string().min(5).max(500),
  background: z.string().max(4000).default(""),
  expertName: z.string().max(80).default(""),
  checklist: z.array(z.string().max(300)).max(20).default([]),
});

export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const parsed = body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the form fields." }, { status: 400 });
  const row = await createInterview({ ...parsed.data, orgId: ctx.orgId, userId: ctx.userId, expertName: parsed.data.expertName || ctx.userName });
  return Response.json({ id: row.id });
}

import { z } from "zod";
import { agentInterview } from "@/lib/agent-auth";
import { addUtterance, interviewerSystem, updateCoverage } from "@/lib/interview";
import { interviewStateMessage } from "@/lib/prompts/interview";

const body = z.object({
  speaker: z.enum(["expert", "interviewer"]),
  text: z.string().min(1).max(8000),
  tStartMs: z.number().int().nonnegative(),
  tEndMs: z.number().int().nonnegative(),
});

// Stores one spoken turn. After each interviewer turn, coverage refreshes and fresh instructions go back to the agent.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const iv = await agentInterview(req, id);
  if (!iv) return Response.json({ error: "Not found." }, { status: 404 });
  const u = body.parse(await req.json());
  await addUtterance(iv, u.speaker, u.text, { tStartMs: u.tStartMs, tEndMs: u.tEndMs });
  if (u.speaker === "expert") return Response.json({ ok: true });
  const updated = await updateCoverage(iv);
  return Response.json({
    ok: true,
    instructions: `${await interviewerSystem(updated, true)}\n\n${interviewStateMessage(updated)}`,
    done: updated.topics.every((t) => t.covered),
  });
}

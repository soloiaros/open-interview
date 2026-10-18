import { agentInterview } from "@/lib/agent-auth";
import { getSettings, interviewerSystem } from "@/lib/interview";
import { interviewStateMessage, openingInstruction } from "@/lib/prompts/interview";

// Everything the voice agent needs to start. The web app stays the single source of interviewer prompts.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const iv = await agentInterview(req, id);
  if (!iv) return Response.json({ error: "Not found." }, { status: 404 });
  const settings = await getSettings(iv.orgId);
  return Response.json({
    instructions: `${await interviewerSystem(iv, true)}\n\n${interviewStateMessage(iv)}`,
    opening: openingInstruction(iv.expertName),
    keyterms: settings.glossary.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).slice(0, 50),
  });
}

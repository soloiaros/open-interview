import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import { apiContext } from "@/lib/context";
import { env } from "@/lib/env";
import { getInterview } from "@/lib/interview";

const AGENT_NAME = "tacivo-interviewer";

// Issues a LiveKit token for the browser and dispatches the interviewer agent into the same room.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) return Response.json({ error: "Not found." }, { status: 404 });
  const room = `interview-${iv.id}-${Date.now()}`;
  const at = new AccessToken(env.livekitKey, env.livekitSecret, { identity: ctx.userId, name: ctx.userName, ttl: "2h" });
  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  at.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: AGENT_NAME, metadata: JSON.stringify({ interviewId: iv.id, orgId: iv.orgId }) })],
  });
  return Response.json({ url: env.livekitUrl, token: await at.toJwt(), room });
}

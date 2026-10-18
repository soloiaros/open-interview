import { timingSafeEqual } from "node:crypto";
import { db } from "@/db/client";
import { interview } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";

/** The voice agent authenticates with a shared secret and can only touch live interviews. */
export async function agentInterview(req: Request, id: string) {
  const given = Buffer.from(req.headers.get("x-agent-secret") ?? "");
  const expected = Buffer.from(env.agentSecret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const [row] = await db.select().from(interview).where(eq(interview.id, id));
  return row && row.status === "live" ? row : null;
}

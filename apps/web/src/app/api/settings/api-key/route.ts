import { db } from "@/db/client";
import { orgSettings } from "@/db/schema";
import { apiContext } from "@/lib/context";
import { hashKey, newApiKey } from "@/lib/secrets";

// Rotates the workspace API key. The full key is shown once; only its hash is stored.
export async function POST() {
  const ctx = await apiContext();
  if (ctx instanceof Response) return ctx;
  const key = newApiKey();
  const values = { apiKeyHash: hashKey(key), apiKeyPrefix: key.slice(0, 8) };
  await db.insert(orgSettings).values({ orgId: ctx.orgId, ...values }).onConflictDoUpdate({ target: orgSettings.orgId, set: values });
  return Response.json({ key });
}

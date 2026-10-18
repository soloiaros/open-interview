import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";

export type Ctx = { userId: string; userName: string; email: string; orgId: string; orgName: string };

/** Resolves the signed-in user and their workspace. Creates the workspace on first visit. */
export async function getContext(): Promise<Ctx | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { user } = session;
  const [row] = await db
    .select({ orgId: organization.id, orgName: organization.name })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, user.id))
    .limit(1);
  if (row) return { userId: user.id, userName: user.name, email: user.email, ...row };

  const orgId = crypto.randomUUID();
  const orgName = `${user.name.split(" ")[0] || "My"}'s workspace`;
  await db.transaction(async (tx) => {
    await tx.insert(organization).values({ id: orgId, name: orgName, slug: orgId, createdAt: new Date() });
    await tx.insert(member).values({ id: crypto.randomUUID(), organizationId: orgId, userId: user.id, role: "owner", createdAt: new Date() });
  });
  return { userId: user.id, userName: user.name, email: user.email, orgId, orgName };
}

/** For pages: redirect to sign-in when there is no session. */
export async function requireContext(): Promise<Ctx> {
  const ctx = await getContext();
  if (!ctx) redirect("/sign-in");
  return ctx;
}

/** For route handlers: returns a 401 response instead of redirecting. */
export async function apiContext(): Promise<Ctx | Response> {
  const ctx = await getContext();
  return ctx ?? Response.json({ error: "Sign in first." }, { status: 401 });
}

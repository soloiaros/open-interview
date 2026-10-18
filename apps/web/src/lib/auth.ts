import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.appUrl,
  secret: env.appSecret,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, autoSignIn: true },
  plugins: [organization(), nextCookies()],
});

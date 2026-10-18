import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg-boss", "postgres"],
  turbopack: { root: process.cwd() },
  agentRules: false,
} as NextConfig;

export default config;

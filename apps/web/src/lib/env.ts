// Central place for configuration. Everything except ANTHROPIC_API_KEY has a working local default.
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "postgres://tacit:tacit@localhost:5433/tacit",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  model: process.env.LLM_MODEL ?? "claude-haiku-5-5",
  livekitUrl: process.env.LIVEKIT_URL ?? "ws://localhost:7880",
  livekitKey: process.env.LIVEKIT_API_KEY ?? "devkey",
  livekitSecret: process.env.LIVEKIT_API_SECRET ?? "secret",
  agentSecret: process.env.AGENT_SHARED_SECRET ?? "change-me-agent-secret",
  appSecret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-dev-secret-dev-secret",
  runWorkerInProcess: (process.env.RUN_WORKER_IN_PROCESS ?? "true") === "true",
};

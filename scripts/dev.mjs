// Starts everything: embedded Postgres, LiveKit, the web app, and the voice agent. Ctrl+C stops all of it.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";
import { loadEnv } from "./env.mjs";

const env = loadEnv();
if (!env.ANTHROPIC_API_KEY && !env.ANTHROPIC_AUTH_TOKEN) console.warn("⚠ ANTHROPIC_API_KEY is not set in .env. The interviewer can't answer without it.\n");

const PG_PORT = Number(env.PG_PORT ?? 5433);
const children = [];
let pg = null;

const COLORS = { db: 33, livekit: 35, web: 36, agent: 32 };
function start(name, cmd, args, opts = {}) {
  const child = spawn(cmd, args, { env: { ...env, ...opts.env }, cwd: opts.cwd, stdio: ["ignore", "pipe", "pipe"] });
  const tag = `\x1b[${COLORS[name]}m${name.padEnd(7)}\x1b[0m│ `;
  const out = (buf) => process.stdout.write(buf.toString().replace(/^(?=.)/gm, tag));
  child.stdout.on("data", out);
  child.stderr.on("data", out);
  child.on("exit", (code) => code && !stopping && console.log(`${tag}exited with code ${code}`));
  children.push(child);
  return child;
}

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  for (const c of children) c.kill("SIGTERM");
  if (pg) await pg.stop().catch(() => {});
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

// 1. Postgres, embedded. Data lives in .data/pg.
let databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  mkdirSync(".data", { recursive: true });
  pg = new EmbeddedPostgres({ databaseDir: ".data/pg", port: PG_PORT, user: "tacit", password: "tacit", persistent: true, onLog: () => {} });
  if (!existsSync(".data/pg/PG_VERSION")) await pg.initialise();
  await pg.start();
  await pg.createDatabase("tacit").catch(() => {});
  databaseUrl = `postgres://tacit:tacit@localhost:${PG_PORT}/tacit`;
  console.log(`\x1b[33mdb     \x1b[0m│ Postgres ready on ${PG_PORT}`);
}

// 2. LiveKit in dev mode (API key "devkey", secret "secret").
const livekitBin = existsSync(".bin/livekit-server") ? ".bin/livekit-server" : "livekit-server";
start("livekit", livekitBin, ["--dev", "--bind", "127.0.0.1"]);

const shared = {
  DATABASE_URL: databaseUrl,
  LIVEKIT_URL: env.LIVEKIT_URL ?? "ws://localhost:7880",
  LIVEKIT_API_KEY: env.LIVEKIT_API_KEY ?? "devkey",
  LIVEKIT_API_SECRET: env.LIVEKIT_API_SECRET ?? "secret",
  APP_URL: env.APP_URL ?? "http://localhost:3000",
};

// 3. Web app (also runs migrations and the ingest worker).
start("web", "npm", ["run", "dev"], { cwd: "apps/web", env: shared });

// 4. Voice agent.
if (existsSync("apps/agent/.venv/bin/python")) start("agent", ".venv/bin/python", ["agent.py", "dev"], { cwd: "apps/agent", env: shared });
else console.warn("Voice agent not set up. Run npm run setup for voice interviews. Text interviews work without it.");

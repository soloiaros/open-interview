// Standalone worker for production. In dev the worker runs inside the Next.js server (see instrumentation.ts).
import { runMigrations } from "@/db/migrate";
import { startWorker } from "./run";

await runMigrations();
await startWorker();

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("@/lib/env");
  const { runMigrations } = await import("@/db/migrate");
  try {
    await runMigrations();
  } catch (err) {
    console.error("Database not ready. Start it with `docker compose up db`.", err);
    return;
  }
  if (env.runWorkerInProcess) {
    const { startWorker } = await import("@/worker/run");
    await startWorker();
  }
}

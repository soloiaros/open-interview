import { PgBoss } from "pg-boss";
import { env } from "@/lib/env";

export const INGEST_QUEUE = "ingest-source";

const globalForBoss = globalThis as unknown as { boss?: Promise<PgBoss> };

export function getBoss(): Promise<PgBoss> {
  globalForBoss.boss ??= (async () => {
    const boss = new PgBoss(env.databaseUrl);
    boss.on("error", (err) => console.error("pg-boss", err));
    await boss.start();
    await boss.createQueue(INGEST_QUEUE);
    return boss;
  })();
  return globalForBoss.boss;
}

export async function enqueueIngest(sourceId: string) {
  const boss = await getBoss();
  await boss.send(INGEST_QUEUE, { sourceId }, { retryLimit: 2, retryDelay: 30 });
}

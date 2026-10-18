import { runIngest } from "@/lib/ingest";
import { getBoss, INGEST_QUEUE } from "@/lib/queue";

let started = false;

/** Starts the ingest worker. Safe to call more than once per process. */
export async function startWorker() {
  if (started) return;
  started = true;
  const boss = await getBoss();
  await boss.work<{ sourceId: string }>(INGEST_QUEUE, async (jobs) => {
    for (const job of jobs) {
      const stats = await runIngest(job.data.sourceId);
      console.log(`ingested ${job.data.sourceId}`, stats);
    }
  });
  console.log("ingest worker running");
}

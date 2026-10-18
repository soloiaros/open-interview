import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { ingestRun, interview, source } from "@/db/schema";
import { Badge, Label, LinkButton, PageTitle } from "@/components/ui";
import { requireContext } from "@/lib/context";
import { when } from "@/lib/format";
import { MODE_LABELS } from "@/lib/prompts/interview";

const STATUS = { live: { text: "In progress", tone: "accent" }, ended: { text: "Draft", tone: "neutral" }, published: { text: "In wiki", tone: "neutral" } } as const;

export default async function Interviews() {
  const ctx = await requireContext();
  const [rows, runs] = await Promise.all([
    db.select().from(interview).where(eq(interview.orgId, ctx.orgId)).orderBy(desc(interview.updatedAt)).limit(50),
    db
      .select({ id: ingestRun.id, status: ingestRun.status, stats: ingestRun.stats, createdAt: ingestRun.createdAt, title: source.title })
      .from(ingestRun)
      .innerJoin(source, eq(ingestRun.sourceId, source.id))
      .where(eq(ingestRun.orgId, ctx.orgId))
      .orderBy(desc(ingestRun.createdAt))
      .limit(3),
  ]);

  return (
    <div className="enter flex flex-col gap-14">
      <div className="flex flex-col gap-8">
        <PageTitle title="Interviews" lead="Talk for fifteen minutes." rest="We ask the follow-up questions, write it up, and file it in your wiki." />
        <LinkButton href="/app/interview/new">Start interview</LinkButton>
      </div>

      {runs.some((r) => r.status === "running" || r.status === "queued") && (
        <p className="flex items-center gap-3 text-[14px] text-ink-2">
          <span className="size-2 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-accent" />
          Filing “{runs.find((r) => r.status === "running" || r.status === "queued")!.title}” into the wiki. Refresh in a minute.
        </p>
      )}

      <section className="flex flex-col">
        <Label className="mb-3">{rows.length ? `${rows.length} interview${rows.length === 1 ? "" : "s"}` : "No interviews yet"}</Label>
        {rows.length === 0 ? (
          <p className="max-w-[52ch] text-ink-3">Pick someone who knows a process nobody wrote down. Their first session takes about fifteen minutes.</p>
        ) : (
          <ul className="flex flex-col">
            {rows.map((r) => {
              const covered = r.topics.filter((t) => t.covered).length;
              const href = r.status === "live" ? `/app/interview/${r.id}` : `/app/interview/${r.id}/draft`;
              return (
                <li key={r.id}>
                  <Link href={href} className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-5 transition-colors hover:border-ink-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-[17px] text-ink">{r.title}</span>
                      <span className="text-[13px] text-ink-3">
                        {MODE_LABELS[r.mode].label} · {r.expertName || "Unnamed expert"} · {covered}/{r.topics.length} topics · {when(r.updatedAt)}
                      </span>
                    </div>
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].text}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

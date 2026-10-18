import Link from "next/link";
import { notFound } from "next/navigation";
import { Label } from "@/components/ui";
import { MODE_LABELS } from "@/lib/constants";
import { requireContext } from "@/lib/context";
import { clock, when } from "@/lib/format";
import { getInterview, getUtterances } from "@/lib/interview";

// Read-only transcript. Citation chips link here with #u-<utteranceId>; the target line highlights.
export default async function Transcript({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireContext();
  const { id } = await params;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) notFound();
  const utts = await getUtterances(id);
  return (
    <article className="flex max-w-[760px] flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Label>
          Transcript · {MODE_LABELS[iv.mode].label} · {iv.expertName} · {when(iv.createdAt)}
        </Label>
        <h1 className="display text-[44px] sm:text-[56px]">{iv.title}</h1>
        <Link href={`/app/interview/${id}/draft`} className="w-fit text-[14px] text-ink-3 underline underline-offset-4 hover:text-ink">
          Open the written draft
        </Link>
      </header>
      <ol className="flex flex-col gap-6">
        {utts.map((u) => (
          <li key={u.id} id={`u-${u.id}`} className="grid scroll-mt-28 grid-cols-[44px_1fr] gap-4 rounded-tile transition-colors target:bg-accent-tint target:p-3">
            <span className="pt-1.5 font-mono text-[11px] text-ink-3">{clock(u.tStartMs)}</span>
            {u.speaker === "interviewer" ? <p className="serif-i text-[21px] leading-[1.3] text-ink-2">{u.text}</p> : <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-ink">{u.text}</p>}
          </li>
        ))}
      </ol>
    </article>
  );
}

import Link from "next/link";
import { clock } from "@/lib/format";

export type CiteInfo = { label: string; title: string; quote?: string; href?: string; meta?: string };

// Numbered chip. Hover or focus shows the evidence; click jumps to it.
export function CitationChip({ info }: { info: CiteInfo }) {
  const chip = (
    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] bg-accent-tint px-1 align-[2px] font-mono text-[10px] leading-none text-accent">{info.label}</span>
  );
  return (
    <span className="group/cite relative mx-0.5 inline-block not-prose">
      {info.href ? (
        <Link href={info.href} className="no-underline">
          {chip}
        </Link>
      ) : (
        <span tabIndex={0}>{chip}</span>
      )}
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-[300px] -translate-x-1/2 translate-y-1 rounded-tile border border-line bg-raised p-4 text-left text-[13px] leading-snug opacity-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] transition-[opacity,transform] duration-200 group-focus-within/cite:visible group-focus-within/cite:translate-y-0 group-focus-within/cite:opacity-100 group-hover/cite:visible group-hover/cite:translate-y-0 group-hover/cite:opacity-100"
      >
        <span className="block text-ink">{info.title}</span>
        {info.meta && <span className="mt-1 block font-mono text-[11px] uppercase text-ink-3">{info.meta}</span>}
        {info.quote && <span className="serif-i mt-2 block text-[16px] text-ink-2">“{info.quote}”</span>}
      </span>
    </span>
  );
}

export const transcriptHref = (interviewId: string | null, tStartMs: number | null, utteranceId?: string | null) =>
  interviewId ? `/app/interview/${interviewId}/transcript${utteranceId ? `#u-${utteranceId}` : tStartMs != null ? `#t-${tStartMs}` : ""}` : undefined;

export const atTime = (ms: number | null | undefined) => (ms == null ? undefined : `at ${clock(ms)}`);

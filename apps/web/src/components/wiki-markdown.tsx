import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { CitationChip, atTime, transcriptHref, type CiteInfo } from "@/components/citation";

export type ClaimRef = { label: string; title: string; quote: string; expert: string; interviewId: string | null; tStartMs: number | null; utteranceId: string | null; count: number };

/**
 * Renders a wiki page. [[Title]] becomes an internal link; [^c-xxxxxxxx] becomes a numbered evidence chip
 * that opens the transcript at the quoted moment.
 */
export function WikiMarkdown({ md, claims, titles }: { md: string; claims: Record<string, ClaimRef>; titles: Record<string, string> }) {
  const order: string[] = [];
  const prepared = md
    .replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, title: string, alias?: string) => {
      const slug = titles[title.trim().toLowerCase()];
      return slug ? `[${alias ?? title}](/app/wiki/${slug})` : alias ?? title;
    })
    .replace(/\s?\[\^(c-[0-9a-f]{8})\]/g, (_, label: string) => {
      if (!order.includes(label)) order.push(label);
      return ` [${order.indexOf(label) + 1}](#claim-${label})`;
    });

  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("#claim-")) {
              const ref = claims[href.slice(7)];
              const n = String(children);
              const info: CiteInfo = ref
                ? {
                    label: n,
                    title: ref.expert ? `${ref.expert}, ${ref.title}` : ref.title,
                    quote: ref.quote,
                    href: transcriptHref(ref.interviewId, ref.tStartMs, ref.utteranceId),
                    meta: [atTime(ref.tStartMs), ref.count > 1 ? `${ref.count} sources agree` : undefined].filter(Boolean).join(" · "),
                  }
                : { label: n, title: "Evidence removed" };
              return <CitationChip info={info} />;
            }
            if (href?.startsWith("/")) return <Link href={href}>{children}</Link>;
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children} ↗
              </a>
            );
          },
        }}
      >
        {prepared}
      </ReactMarkdown>
    </div>
  );
}

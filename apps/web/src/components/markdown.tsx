"use client";
import { Streamdown } from "streamdown";
import type { Citation } from "@/lib/constants";
import { CitationChip, atTime, transcriptHref, type CiteInfo } from "@/components/citation";

// Turns "[3]" and "[2, 5]" into links the renderer swaps for chips. Skips fenced code.
function linkNumbers(md: string) {
  return md
    .split(/(```[\s\S]*?(?:```|$))/g)
    .map((part) => (part.startsWith("```") ? part : part.replace(/\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g, (_, nums: string) => nums.split(",").map((n) => `[${n.trim()}](#cite-${n.trim()})`).join(""))))
    .join("");
}

export function citeInfo(c: Citation): CiteInfo {
  return c.kind === "page"
    ? { label: String(c.n), title: c.title, href: `/app/wiki/${c.slug}`, meta: "Wiki page" }
    : { label: String(c.n), title: c.title, quote: c.quote, href: transcriptHref(c.interviewId, c.tStartMs), meta: ["Interview", atTime(c.tStartMs)].filter(Boolean).join(" ") };
}

/** Markdown that may still be streaming. Used for chat answers, drafts, and generated documents. */
export function StreamMarkdown({ text, citations = [], streaming = false }: { text: string; citations?: Citation[]; streaming?: boolean }) {
  const byN = new Map(citations.map((c) => [String(c.n), c]));
  return (
    <div className="prose">
      <Streamdown
        isAnimating={streaming}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("#cite-")) {
              const n = href.slice(6);
              const c = byN.get(n);
              return c ? <CitationChip info={citeInfo(c)} /> : <CitationChip info={{ label: n, title: streaming ? "Source" : "Source not found" }} />;
            }
            return <a href={href}>{children}</a>;
          },
        }}
      >
        {linkNumbers(text)}
      </Streamdown>
    </div>
  );
}

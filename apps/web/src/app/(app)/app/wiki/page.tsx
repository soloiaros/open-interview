import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { page } from "@/db/schema";
import { PAGE_TYPES } from "@/lib/constants";
import { Badge, GhostButton, Label, PageTitle } from "@/components/ui";
import { WikiSearch } from "@/components/wiki/search";
import { requireContext } from "@/lib/context";
import { PAGE_TYPE_LABEL, when } from "@/lib/format";

export default async function Wiki({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const ctx = await requireContext();
  const { type } = await searchParams;
  const rows = await db
    .select({ slug: page.slug, title: page.title, type: page.type, summary: page.summary, status: page.status, updatedAt: page.updatedAt, version: page.version })
    .from(page)
    .where(eq(page.orgId, ctx.orgId))
    .orderBy(asc(page.title));
  const counts = Object.fromEntries(PAGE_TYPES.map((t) => [t, rows.filter((r) => r.type === t).length]));
  const shown = type ? rows.filter((r) => r.type === type) : rows;
  const review = rows.filter((r) => r.status === "needs_review").length;

  return (
    <div className="enter flex flex-col gap-12">
      <div className="flex flex-col gap-8">
        <PageTitle title="Wiki" lead={`${rows.length} page${rows.length === 1 ? "" : "s"}.`} rest="Written from interviews. Every fact links to the moment someone said it." />
        <div className="flex flex-wrap items-center gap-4">
          <WikiSearch pages={rows.map((r) => ({ slug: r.slug, title: r.title, type: r.type, summary: r.summary }))} />
          <GhostButton href="/app/wiki/graph">{"< Graph />"}</GhostButton>
        </div>
      </div>

      <nav aria-label="Page types" className="flex flex-wrap gap-2">
        <TypeLink href="/app/wiki" active={!type} label="All" n={rows.length} />
        {PAGE_TYPES.filter((t) => counts[t] > 0).map((t) => (
          <TypeLink key={t} href={`/app/wiki?type=${t}`} active={type === t} label={PAGE_TYPE_LABEL[t]} n={counts[t]} />
        ))}
        {review > 0 && <Badge tone="accent" className="ml-2 self-center">{review} to review</Badge>}
      </nav>

      {rows.length === 0 ? (
        <p className="max-w-[52ch] text-ink-3">The wiki fills itself when you publish an interview. Publishing takes about a minute per interview.</p>
      ) : (
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {shown.map((r) => (
            <li key={r.slug}>
              <Link href={`/app/wiki/${r.slug}`} className="group flex flex-col gap-1 border-b border-line py-5 transition-colors hover:border-ink-3">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[17px] text-ink">{r.title}</span>
                  <Label className="shrink-0">{PAGE_TYPE_LABEL[r.type]}</Label>
                </span>
                <span className="line-clamp-2 text-[14px] text-ink-3">{r.summary}</span>
                <span className="font-mono text-[10px] uppercase text-ink-3">
                  v{r.version} · {when(r.updatedAt)}
                  {r.status === "needs_review" ? " · needs review" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypeLink({ href, active, label, n }: { href: string; active: boolean; label: string; n: number }) {
  return (
    <Link href={href} className={`rounded-pill px-4 py-2 text-[13px] transition-colors ${active ? "bg-ink text-bg" : "bg-tint text-ink-2 hover:text-ink"}`}>
      {label} <span className="font-mono text-[11px] opacity-60">{n}</span>
    </Link>
  );
}

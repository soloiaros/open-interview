import Link from "next/link";
import { notFound } from "next/navigation";
import { PageControls } from "@/components/wiki/page-controls";
import { WikiMarkdown } from "@/components/wiki-markdown";
import { Badge, Label } from "@/components/ui";
import { requireContext } from "@/lib/context";
import { PAGE_TYPE_LABEL, when } from "@/lib/format";
import { getPageView } from "@/lib/wiki";

const EDIT_MODE = { llm_managed: "AI maintained", hybrid: "Append only", human_locked: "Locked" } as const;

export default async function WikiPage({ params }: { params: Promise<{ slug: string }> }) {
  const ctx = await requireContext();
  const { slug } = await params;
  const v = await getPageView(ctx.orgId, decodeURIComponent(slug));
  if (!v) notFound();
  const { page: p } = v;

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_260px]">
      <article className="enter flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label>{PAGE_TYPE_LABEL[p.type]}</Label>
            {p.status === "needs_review" && <Badge tone="accent">Needs review</Badge>}
            {v.contested.length > 0 && <Badge tone="danger">Experts disagree</Badge>}
          </div>
          <h1 className="display text-[48px] sm:text-[64px]">{p.title}</h1>
          {p.summary && <p className="max-w-[60ch] text-[17px] leading-snug text-ink">{p.summary}</p>}
        </header>
        <WikiMarkdown md={p.bodyMd || "_This page has no content yet._"} claims={v.refs} titles={v.titles} />
      </article>

      <aside className="flex flex-col gap-10 text-[14px] lg:sticky lg:top-24 lg:self-start">
        <PageControls id={p.id} slug={p.slug} title={p.title} summary={p.summary} bodyMd={p.bodyMd} editMode={p.editMode} status={p.status} />
        <Meta label="Status">
          {EDIT_MODE[p.editMode]} · v{p.version} · {when(p.updatedAt)}
        </Meta>
        {v.sources.length > 0 && (
          <Meta label={`${v.sources.length} source${v.sources.length === 1 ? "" : "s"}`}>
            <ul className="flex flex-col gap-2">
              {v.sources.map((s) => (
                <li key={s.id}>
                  {s.interviewId ? (
                    <Link href={`/app/interview/${s.interviewId}/transcript`} className="text-ink-2 hover:text-ink">
                      {s.title}
                    </Link>
                  ) : (
                    <span className="text-ink-2">{s.title}</span>
                  )}
                  {s.expert && <span className="block text-[12px] text-ink-3">{s.expert}</span>}
                </li>
              ))}
            </ul>
          </Meta>
        )}
        {(v.outgoing.length > 0 || v.backlinks.length > 0) && (
          <Meta label="Linked pages">
            <ul className="flex flex-col gap-1.5">
              {[...new Map([...v.outgoing, ...v.backlinks].map((x) => [x!.id, x!])).values()].map((x) => (
                <li key={x.id}>
                  <Link href={`/app/wiki/${x.slug}`} className="text-ink-2 hover:text-ink">
                    {x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Meta>
        )}
      </aside>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="text-ink-2">{children}</div>
    </div>
  );
}

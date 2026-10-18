import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { document } from "@/db/schema";
import { CreateForm } from "@/components/create/create-form";
import { Label, PageTitle } from "@/components/ui";
import { DOCUMENT_LABELS } from "@/lib/constants";
import { requireContext } from "@/lib/context";
import { when } from "@/lib/format";

export default async function Create() {
  const ctx = await requireContext();
  const docs = await db
    .select({ id: document.id, title: document.title, type: document.type, createdAt: document.createdAt })
    .from(document)
    .where(eq(document.orgId, ctx.orgId))
    .orderBy(desc(document.createdAt))
    .limit(20);
  return (
    <div className="enter flex flex-col gap-14">
      <PageTitle title="Create" lead="Turn the wiki into documents people use." rest="Each line cites the page or interview it came from." />
      <CreateForm />
      {docs.length > 0 && (
        <section className="flex flex-col">
          <Label className="mb-3">Recent documents</Label>
          <ul>
            {docs.map((d) => (
              <li key={d.id}>
                <Link href={`/app/documents/${d.id}`} className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-line py-4 transition-colors hover:border-ink-3">
                  <span className="truncate text-[16px] text-ink">{d.title}</span>
                  <span className="font-mono text-[11px] uppercase text-ink-3">
                    {DOCUMENT_LABELS[d.type].label} · {when(d.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { document } from "@/db/schema";
import { DocumentActions } from "@/components/create/document-actions";
import { StreamMarkdown } from "@/components/markdown";
import { Label } from "@/components/ui";
import { DOCUMENT_LABELS } from "@/lib/constants";
import { requireContext } from "@/lib/context";
import { getSettings } from "@/lib/interview";
import { when } from "@/lib/format";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireContext();
  const { id } = await params;
  const [doc] = await db.select().from(document).where(and(eq(document.id, id), eq(document.orgId, ctx.orgId)));
  if (!doc) notFound();
  const s = await getSettings(ctx.orgId);
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
      <article className="flex min-w-0 flex-col gap-6">
        <Label>
          {DOCUMENT_LABELS[doc.type].label} · {when(doc.createdAt)}
        </Label>
        <StreamMarkdown text={doc.bodyMd} citations={doc.citations} />
      </article>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <DocumentActions id={doc.id} markdown={doc.bodyMd} notionReady={Boolean(s.notionTokenEnc && s.notionParentPageId)} />
      </aside>
    </div>
  );
}

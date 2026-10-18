import { notFound } from "next/navigation";
import { DraftEditor } from "@/components/interview/draft-editor";
import { MODE_LABELS } from "@/lib/constants";
import { requireContext } from "@/lib/context";
import { getInterview } from "@/lib/interview";

export default async function DraftPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ generate?: string }> }) {
  const ctx = await requireContext();
  const { id } = await params;
  const { generate } = await searchParams;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) notFound();
  return (
    <DraftEditor
      id={iv.id}
      title={iv.title}
      modeLabel={MODE_LABELS[iv.mode].label}
      initial={iv.draftMd}
      published={iv.status === "published"}
      autoGenerate={iv.status !== "published" && (generate === "1" || !iv.draftMd)}
    />
  );
}

import { notFound, redirect } from "next/navigation";
import { InterviewRoom } from "@/components/interview/room";
import { MODE_LABELS } from "@/lib/constants";
import { requireContext } from "@/lib/context";
import { getInterview, getUtterances } from "@/lib/interview";

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireContext();
  const { id } = await params;
  const iv = await getInterview(ctx.orgId, id);
  if (!iv) notFound();
  if (iv.status !== "live") redirect(`/app/interview/${id}/draft`);
  const utts = await getUtterances(id);
  return (
    <InterviewRoom
      id={iv.id}
      title={iv.title}
      modeLabel={MODE_LABELS[iv.mode].label}
      initial={{ topics: iv.topics, notes: iv.notes, checklist: iv.checklist }}
      utterances={utts.map((u) => ({ id: u.id, speaker: u.speaker, text: u.text, tStartMs: u.tStartMs }))}
    />
  );
}

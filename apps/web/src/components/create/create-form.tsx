"use client";
import Link from "next/link";
import { useState } from "react";
import { DOCUMENT_LABELS, DOCUMENT_TYPES, type Citation, type DocumentType } from "@/lib/constants";
import { StreamMarkdown } from "@/components/markdown";
import { Button, Field, TextArea } from "@/components/ui";
import { readStream } from "@/lib/read-stream";
import { cn } from "@/lib/cn";

const PLACEHOLDER: Record<DocumentType, string> = {
  handover: "Handover of the Leeds supplier quality role from Maren to Tomás",
  sop: "Incoming inspection for cast parts",
  onboarding_guide: "First month for a new production planner",
  training_module: "Spotting a failing supplier batch early",
  decision_tree: "Accept, rework, or reject a non-conforming batch",
};

export function CreateForm() {
  const [type, setType] = useState<DocumentType>("sop");
  const [brief, setBrief] = useState("");
  const [text, setText] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [docId, setDocId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    setText("");
    setDocId(null);
    setCitations([]);
    try {
      const res = await fetch("/api/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, brief }) });
      await readStream<{ type: string; text?: string; id?: string; citations?: Citation[] }>(res, (e) => {
        if (e.type === "delta") setText((t) => t + e.text);
        if (e.type === "done") {
          setDocId(e.id!);
          setCitations(e.citations ?? []);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't write the document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-3 sm:grid-cols-5">
        {DOCUMENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={cn(
              "flex cursor-pointer flex-col gap-2 rounded-tile p-4 text-left transition-[background-color,transform] duration-200 active:scale-[0.98]",
              type === t ? "bg-ink text-bg" : "bg-surface text-ink hover:bg-raised",
            )}
          >
            <span className="text-[15px] font-bold">{DOCUMENT_LABELS[t].label}</span>
            <span className={cn("text-[12px] leading-snug", type === t ? "text-bg/70" : "text-ink-3")}>{DOCUMENT_LABELS[t].blurb}</span>
          </button>
        ))}
      </div>
      <Field label="Brief" hint="Who it's for and what it should cover.">
        <TextArea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={PLACEHOLDER[type]} className="min-h-20" />
      </Field>
      <div className="flex items-center gap-6">
        <Button onClick={generate} disabled={busy || brief.trim().length < 3}>
          {busy ? "Writing" : `Write ${DOCUMENT_LABELS[type].label.toLowerCase()}`}
        </Button>
        {docId && (
          <Link href={`/app/documents/${docId}`} className="text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink">
            Open to export
          </Link>
        )}
      </div>
      {error && <p className="text-[14px] text-danger">{error}</p>}
      {(text || busy) && (
        <div className="rounded-card bg-surface p-8 sm:p-12">
          <StreamMarkdown text={text} citations={citations} streaming={busy} />
        </div>
      )}
    </div>
  );
}

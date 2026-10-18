"use client";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { editorTheme } from "@/components/interview/draft-editor";
import { Button, Field, GhostButton, Input } from "@/components/ui";
import { cn } from "@/lib/cn";

type Mode = "llm_managed" | "hybrid" | "human_locked";
const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "llm_managed", label: "AI", hint: "New interviews may rewrite this page." },
  { value: "hybrid", label: "Append", hint: "New interviews only add sections." },
  { value: "human_locked", label: "Locked", hint: "New interviews never change it." },
];

export function PageControls(props: { id: string; slug: string; title: string; summary: string; bodyMd: string; editMode: Mode; status: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(props.title);
  const [summary, setSummary] = useState(props.summary);
  const [body, setBody] = useState(props.bodyMd);
  const [busy, setBusy] = useState(false);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/pages/${props.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Who maintains this page" className="flex rounded-pill bg-tint p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            role="radio"
            aria-checked={props.editMode === m.value}
            title={m.hint}
            disabled={busy}
            onClick={() => patch({ editMode: m.value })}
            className={cn("flex-1 cursor-pointer rounded-pill py-1.5 text-[12px] transition-colors duration-300", props.editMode === m.value ? "bg-ink text-bg" : "text-ink-2 hover:text-ink")}
          >
            {m.label}
          </button>
        ))}
      </div>
      <span className="text-[12px] text-ink-3">{MODES.find((m) => m.value === props.editMode)?.hint}</span>
      <div className="flex flex-wrap gap-2">
        <GhostButton onClick={() => setEditing(true)}>Edit page</GhostButton>
        {props.status === "needs_review" && (
          <GhostButton onClick={() => patch({ status: "published" })} disabled={busy}>
            Mark reviewed
          </GhostButton>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className="flex w-full max-w-[860px] flex-col gap-6 rounded-card bg-surface p-8" onClick={(e) => e.stopPropagation()}>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Index summary" hint="One sentence, up to 140 characters.">
              <Input value={summary} maxLength={160} onChange={(e) => setSummary(e.target.value)} />
            </Field>
            <Field label="Body" hint="Markdown. Keep [^c-…] markers to keep citations. Link pages with [[Page title]].">
              <div className="rounded-tile border border-line p-4">
                <CodeMirror value={body} onChange={setBody} extensions={[markdown(), EditorView.lineWrapping]} theme={editorTheme} basicSetup={{ lineNumbers: false, foldGutter: false }} />
              </div>
            </Field>
            <div className="flex items-center gap-4">
              <Button
                disabled={busy}
                onClick={async () => {
                  await patch({ title, summary, bodyMd: body });
                  setEditing(false);
                }}
              >
                Save page
              </Button>
              <button className="cursor-pointer text-[13px] text-ink-3 hover:text-ink" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

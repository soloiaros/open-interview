"use client";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StreamMarkdown } from "@/components/markdown";
import { Button, GhostButton, Label } from "@/components/ui";
import { readStream } from "@/lib/read-stream";
import { cn } from "@/lib/cn";

export const editorTheme = EditorView.theme(
  {
    "&": { backgroundColor: "transparent", color: "var(--color-ink)", fontSize: "15px" },
    ".cm-content": { fontFamily: "var(--font-mono)", caretColor: "var(--color-ink)", padding: "0" },
    ".cm-gutters": { display: "none" },
    ".cm-activeLine": { backgroundColor: "transparent" },
    "&.cm-focused": { outline: "none" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "var(--color-accent-tint) !important" },
  },
  { dark: false },
);

export function DraftEditor(props: { id: string; title: string; modeLabel: string; initial: string; published: boolean; autoGenerate: boolean }) {
  const router = useRouter();
  const [md, setMd] = useState(props.initial);
  const [streaming, setStreaming] = useState(false);
  const [view, setView] = useState<"read" | "edit">("read");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ran = useRef(false);

  async function generate() {
    setStreaming(true);
    setError("");
    setMd("");
    try {
      const res = await fetch(`/api/interviews/${props.id}/draft`, { method: "POST" });
      await readStream<{ type: string; text?: string }>(res, (e) => e.type === "delta" && setMd((m) => m + e.text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't write the draft.");
    } finally {
      setStreaming(false);
      router.replace(`/app/interview/${props.id}/draft`, { scroll: false });
    }
  }

  useEffect(() => {
    if (props.autoGenerate && !ran.current) {
      ran.current = true;
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function publish() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/interviews/${props.id}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draftMd: md, verified: true }) });
    if (!res.ok) {
      setBusy(false);
      return setError((await res.json()).error ?? "Couldn't publish.");
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="flex min-w-0 flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Label>{props.published ? "Published" : streaming ? "Writing draft" : "Draft"} · {props.modeLabel}</Label>
          {!md && !streaming && <h1 className="display text-[56px]">{props.title}</h1>}
        </div>
        {view === "edit" && !streaming ? (
          <div className="rounded-card bg-surface p-6">
            <CodeMirror value={md} onChange={setMd} extensions={[markdown(), EditorView.lineWrapping]} theme={editorTheme} basicSetup={{ lineNumbers: false, foldGutter: false }} />
          </div>
        ) : (
          <StreamMarkdown text={md || (streaming ? "" : "No draft yet.")} streaming={streaming} />
        )}
        {error && <p className="text-[14px] text-danger">{error}</p>}
      </section>

      <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
        <div className="flex gap-2">
          {(["read", "edit"] as const).map((v) => (
            <button
              key={v}
              disabled={streaming || props.published}
              onClick={() => setView(v)}
              className={cn("cursor-pointer rounded-pill px-4 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40", view === v ? "bg-ink text-bg" : "bg-tint text-ink-2 hover:text-ink")}
            >
              {v === "read" ? "Read" : "Edit"}
            </button>
          ))}
        </div>
        {props.published ? (
          <p className="text-[14px] text-ink-2">This interview is in the wiki.</p>
        ) : (
          <>
            <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-ink-2">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} disabled={streaming || !md} className="mt-0.5 size-4 accent-[var(--color-accent)]" />
              I read this draft and it says what I meant.
            </label>
            <Button onClick={publish} disabled={!verified || streaming || busy || !md}>
              {busy ? "Publishing" : "Publish to wiki"}
            </Button>
            <GhostButton onClick={generate} disabled={streaming}>
              Rewrite draft
            </GhostButton>
          </>
        )}
        <Link href={`/app/interview/${props.id}/transcript`} className="text-[13px] text-ink-3 underline underline-offset-4 hover:text-ink">
          Read the transcript
        </Link>
      </aside>
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChecklistItem, Note, Topic } from "@/lib/constants";
import { Button, GhostButton, Label } from "@/components/ui";
import { VoiceSession } from "@/components/interview/voice";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/format";
import { readStream } from "@/lib/read-stream";

export type Utt = { id: string; speaker: "expert" | "interviewer"; text: string; tStartMs: number };
type State = { topics: Topic[]; notes: Note[]; checklist: ChecklistItem[] };

export function InterviewRoom(props: { id: string; title: string; modeLabel: string; initial: State; utterances: Utt[] }) {
  const router = useRouter();
  const [utts, setUtts] = useState<Utt[]>(props.utterances);
  const [state, setState] = useState<State>(props.initial);
  const [pending, setPending] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [voice, setVoice] = useState(false);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const covered = state.topics.filter((t) => t.covered).length;
  const expertTurns = utts.filter((u) => u.speaker === "expert").length;
  const allCovered = state.topics.length > 0 && covered === state.topics.length;

  const turn = useCallback(
    async (text?: string) => {
      setError("");
      setPending("");
      if (text) setUtts((u) => [...u, { id: `tmp-${Date.now()}`, speaker: "expert", text, tStartMs: u.at(-1)?.tStartMs ?? 0 }]);
      try {
        const res = await fetch(`/api/interviews/${props.id}/turn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
        await readStream<{ type: string; text?: string; utterance?: Utt } & Partial<State>>(res, (e) => {
          if (e.type === "delta") setPending((p) => (p ?? "") + e.text);
          if (e.type === "expert") setUtts((u) => [...u.filter((x) => !x.id.startsWith("tmp-")), e.utterance!]);
          if (e.type === "interviewer") {
            setUtts((u) => [...u, e.utterance!]);
            setPending(null);
          }
          if (e.type === "state") setState({ topics: e.topics!, notes: e.notes!, checklist: e.checklist! });
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "The interviewer didn't answer. Try again.");
      } finally {
        setPending(null);
      }
    },
    [props.id],
  );

  // Text mode opens with the interviewer's first question.
  useEffect(() => {
    if (!started.current && !voice && utts.length === 0) {
      started.current = true;
      void turn();
    }
  }, [turn, utts.length, voice]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [utts.length, pending]);

  // While voice runs, the agent writes the transcript server-side. Poll it.
  useEffect(() => {
    if (!voice) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/interviews/${props.id}`);
      if (!res.ok) return;
      const { interview, utterances } = await res.json();
      setUtts(utterances);
      setState({ topics: interview.topics, notes: interview.notes, checklist: interview.checklist });
    }, 2500);
    return () => clearInterval(t);
  }, [voice, props.id]);

  async function saveNotes(notes: Note[]) {
    setState((s) => ({ ...s, notes }));
    await fetch(`/api/interviews/${props.id}/notes`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ notes }) });
  }

  function send() {
    const text = input.trim();
    if (!text || pending !== null) return;
    setInput("");
    void turn(text);
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-w-0 flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Label>{props.modeLabel}</Label>
            <h1 className="display text-[44px] sm:text-[56px]">{props.title}</h1>
          </div>
          <ModeSwitch voice={voice} onChange={setVoice} disabled={pending !== null} />
        </div>

        {voice ? (
          <VoiceSession interviewId={props.id} onEnd={() => setVoice(false)} />
        ) : null}

        <ol className="flex flex-col gap-7" aria-live="polite">
          {utts.map((u) => (
            <Line key={u.id} u={u} />
          ))}
          {pending !== null && (
            <li className="grid grid-cols-[44px_1fr] gap-4">
              <span className="pt-2 font-mono text-[11px] text-ink-3">···</span>
              <p className="serif-i text-[24px] leading-[1.25] text-ink">{pending || <span className="text-ink-3">Thinking</span>}</p>
            </li>
          )}
          <div ref={endRef} />
        </ol>

        {error && <p className="text-[14px] text-danger">{error}</p>}

        {!voice && (
          <div className="sticky bottom-28 flex flex-col gap-3 rounded-card bg-surface p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={3}
              placeholder="Answer in your own words. Enter sends, Shift+Enter adds a line."
              className="w-full resize-none bg-transparent px-3 py-2 text-[16px] text-ink placeholder:text-ink-3 outline-none"
            />
            <div className="flex items-center justify-between gap-3 px-1">
              <span className="font-mono text-[11px] text-ink-3">{covered}/{state.topics.length} topics</span>
              <Button onClick={send} disabled={!input.trim() || pending !== null} className="h-11 px-6">
                Send
              </Button>
            </div>
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-10 lg:sticky lg:top-24 lg:self-start">
        <Progress topics={state.topics} />
        {state.checklist.length > 0 && (
          <div className="flex flex-col gap-3">
            <Label>Must cover</Label>
            <ul className="flex flex-col gap-2 text-[14px]">
              {state.checklist.map((c) => (
                <li key={c.id} className={cn("flex gap-2", c.done ? "text-ink-3 line-through" : "text-ink-2")}>
                  <span aria-hidden>{c.done ? "●" : "○"}</span>
                  {c.text}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Notes notes={state.notes} topics={state.topics} onChange={saveNotes} />
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push(`/app/interview/${props.id}/draft?generate=1`)} disabled={expertTurns < 2 || pending !== null} className={cn(!allCovered && "bg-ink-2")}>
            Generate draft
          </Button>
          <span className="text-[13px] text-ink-3">{allCovered ? "Every topic is covered." : expertTurns < 2 ? "Answer a couple of questions first." : "You can stop early. Uncovered topics stay out of the draft."}</span>
        </div>
      </aside>
    </div>
  );
}

function Line({ u }: { u: Utt }) {
  return (
    <li id={`u-${u.id}`} className="grid animate-[rise_0.35s_ease-out_both] grid-cols-[44px_1fr] gap-4">
      <span className="pt-2 font-mono text-[11px] text-ink-3">{clock(u.tStartMs)}</span>
      {u.speaker === "interviewer" ? <p className="serif-i text-[24px] leading-[1.25] text-ink">{u.text}</p> : <p className="whitespace-pre-wrap pt-1 text-[16px] leading-relaxed text-ink-2">{u.text}</p>}
    </li>
  );
}

function ModeSwitch({ voice, onChange, disabled }: { voice: boolean; onChange: (v: boolean) => void; disabled: boolean }) {
  return (
    <div role="radiogroup" aria-label="Answer by" className="relative flex rounded-pill bg-tint p-1 text-[13px]">
      <span aria-hidden className={cn("absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-pill bg-ink transition-[left] duration-300 ease-[cubic-bezier(0.3,0.9,0.3,1)]", voice ? "left-[50%]" : "left-1")} />
      {[false, true].map((v) => (
        <button
          key={String(v)}
          role="radio"
          aria-checked={voice === v}
          disabled={disabled}
          onClick={() => onChange(v)}
          className={cn("relative z-10 w-20 cursor-pointer rounded-pill py-2 transition-colors duration-300", voice === v ? "text-bg" : "text-ink-2 hover:text-ink")}
        >
          {v ? "Voice" : "Text"}
        </button>
      ))}
    </div>
  );
}

function Progress({ topics }: { topics: Topic[] }) {
  const covered = topics.filter((t) => t.covered).length;
  const next = topics.find((t) => !t.covered);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <Label>Topics</Label>
        <span className="font-mono text-[11px] text-ink-3">{topics.length ? Math.round((covered / topics.length) * 100) : 0}%</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-tint">
        <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out" style={{ width: `${topics.length ? (covered / topics.length) * 100 : 0}%` }} />
      </div>
      <ol className="flex flex-col gap-2.5 text-[14px]">
        {topics.map((t) => (
          <li key={t.id} className={cn("flex items-start gap-2.5 transition-colors", t.covered ? "text-ink-3" : t === next ? "text-ink" : "text-ink-2")}>
            <span aria-hidden className={cn("mt-[3px] text-[10px]", t === next ? "text-accent" : "")}>{t.covered ? "●" : t === next ? "◐" : "○"}</span>
            {t.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Notes({ notes, topics, onChange }: { notes: Note[]; topics: Topic[]; onChange: (n: Note[]) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const label = (id: string | null) => topics.find((t) => t.id === id)?.label;

  function commit() {
    if (editing === "new") {
      if (draft.trim()) onChange([...notes, { id: crypto.randomUUID().slice(0, 8), topicId: null, text: draft.trim(), byUser: true }]);
    } else if (editing) {
      onChange(draft.trim() ? notes.map((n) => (n.id === editing ? { ...n, text: draft.trim(), byUser: true } : n)) : notes.filter((n) => n.id !== editing));
    }
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <Label>Notes</Label>
        <GhostButton onClick={() => (setEditing("new"), setDraft(""))} className="px-3 py-1.5">
          + Add
        </GhostButton>
      </div>
      {notes.length === 0 && editing !== "new" && <p className="text-[13px] text-ink-3">Facts appear here as you talk. Click one to correct it. Your corrections win over the transcript.</p>}
      <ul className="flex flex-col gap-2">
        {notes.map((n) =>
          editing === n.id ? (
            <li key={n.id}>
              <NoteEditor value={draft} onChange={setDraft} onDone={commit} />
            </li>
          ) : (
            <li key={n.id}>
              <button onClick={() => (setEditing(n.id), setDraft(n.text))} className="w-full cursor-pointer rounded-tile px-3 py-2 text-left text-[14px] leading-snug text-ink-2 transition-colors hover:bg-tint">
                {n.text}
                <span className="mt-1 block font-mono text-[10px] uppercase text-ink-3">
                  {n.byUser ? "Your correction" : label(n.topicId) ?? "General"}
                </span>
              </button>
            </li>
          ),
        )}
        {editing === "new" && (
          <li>
            <NoteEditor value={draft} onChange={setDraft} onDone={commit} />
          </li>
        )}
      </ul>
    </div>
  );
}

function NoteEditor({ value, onChange, onDone }: { value: string; onChange: (v: string) => void; onDone: () => void }) {
  return (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onDone();
        }
      }}
      rows={3}
      className="w-full resize-none rounded-tile border border-ink-3 bg-surface px-3 py-2 text-[14px] text-ink outline-none"
    />
  );
}

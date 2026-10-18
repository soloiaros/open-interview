"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Citation } from "@/lib/constants";
import { StreamMarkdown } from "@/components/markdown";
import { Button, GhostButton, Label, PageTitle } from "@/components/ui";
import { readStream } from "@/lib/read-stream";
import { cn } from "@/lib/cn";

type Msg = { id: string; role: "user" | "assistant"; content: string; citations: Citation[] };

const STARTERS = [
  "What do we do when a supplier batch fails incoming inspection?",
  "Who should a new planner talk to in their first week?",
  "Which decisions about the Leeds line are still open?",
  "Summarise what we learned from the last launch.",
];

export function ChatView({ threadId, threads, initial }: { threadId?: string; threads: { id: string; title: string }[]; initial: Msg[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Record<string, string>>({});
  const thread = useRef(threadId);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    setError("");
    setBusy(true);
    const tmp = `a-${Date.now()}`;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: question, citations: [] }, { id: tmp, role: "assistant", content: "", citations: [] }]);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, threadId: thread.current }) });
      await readStream<{ type: string; text?: string; threadId?: string; citations?: Citation[] }>(res, (e) => {
        if (e.type === "thread" && !thread.current) {
          thread.current = e.threadId;
          window.history.replaceState(null, "", `/app/chat?t=${e.threadId}`);
        }
        if (e.type === "delta") setMessages((m) => m.map((x) => (x.id === tmp ? { ...x, content: x.content + e.text } : x)));
        if (e.type === "done") setMessages((m) => m.map((x) => (x.id === tmp ? { ...x, citations: e.citations ?? [] } : x)));
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No answer came back. Try again.");
      setMessages((m) => m.filter((x) => x.id !== tmp));
    } finally {
      setBusy(false);
    }
  }

  async function save(m: Msg) {
    // Freshly streamed messages have temp ids; reload the thread to get real ids first.
    if (m.id.startsWith("a-")) return router.refresh();
    const res = await fetch("/api/chat/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messageId: m.id }) });
    const json = await res.json();
    if (res.ok) setSaved((s) => ({ ...s, [m.id]: json.slug }));
    else setError(json.error ?? "Couldn't save to the wiki.");
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
      <section className="flex min-w-0 flex-col gap-10">
        {messages.length === 0 ? (
          <div className="enter flex flex-col gap-8">
            <PageTitle title="Ask" lead="Ask anything your team has explained." rest="Answers come only from your wiki and interviews, with the source on every line." />
            <ul className="flex flex-col">
              {STARTERS.map((s) => (
                <li key={s}>
                  <button onClick={() => ask(s)} className="w-full cursor-pointer border-b border-line py-4 text-left text-[16px] text-ink-2 transition-colors hover:border-ink-3 hover:text-ink">
                    {s} <span className="text-ink-3">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="flex flex-col gap-10">
            {messages.map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="serif-i animate-[rise_0.3s_ease-out_both] text-[28px] leading-[1.2] text-ink">
                  {m.content}
                </li>
              ) : (
                <li key={m.id} className="flex flex-col gap-3">
                  {m.content ? <StreamMarkdown text={m.content} citations={m.citations} streaming={busy && m === messages.at(-1)} /> : <Label className="animate-[pulse-dot_1.4s_ease-in-out_infinite]">Searching the wiki</Label>}
                  {!busy && m.content && m.citations.length > 0 && (
                    <div className="flex items-center gap-4">
                      {saved[m.id] ? (
                        <Link href={`/app/wiki/${saved[m.id]}`} className="font-mono text-[11px] uppercase text-ink-3 hover:text-ink">
                          Saved to wiki ↗
                        </Link>
                      ) : (
                        <GhostButton onClick={() => save(m)} className="px-3 py-1.5">
                          Save to wiki
                        </GhostButton>
                      )}
                    </div>
                  )}
                </li>
              ),
            )}
            <div ref={end} />
          </ol>
        )}
        {error && <p className="text-[14px] text-danger">{error}</p>}
        <form
          className="sticky bottom-28 flex items-center gap-3 rounded-card bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question" className="h-11 flex-1 bg-transparent px-3 text-[16px] text-ink placeholder:text-ink-3 outline-none" />
          <Button type="submit" disabled={!input.trim() || busy} className="h-11 px-6">
            Ask
          </Button>
        </form>
      </section>

      <aside className="hidden flex-col gap-3 lg:flex lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-baseline justify-between">
          <Label>Recent</Label>
          <Link href="/app/chat" className="font-mono text-[11px] uppercase text-ink-3 hover:text-ink">
            New
          </Link>
        </div>
        <ul className="flex flex-col gap-1">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/app/chat?t=${t.id}`} className={cn("block truncate rounded-tile px-3 py-2 text-[14px] transition-colors hover:bg-tint", t.id === threadId ? "bg-tint text-ink" : "text-ink-3")}>
                {t.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

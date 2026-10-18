"use client";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PAGE_TYPE_LABEL } from "@/lib/format";

type P = { slug: string; title: string; type: string; summary: string };

// ⌘K page finder. Client-side filter over titles and summaries; Ask covers full-text questions.
export function WikiSearch({ pages }: { pages: P[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-12 w-full max-w-[420px] cursor-pointer items-center justify-between rounded-tile border border-line bg-surface px-4 text-[15px] text-ink-3 transition-colors hover:border-ink-3">
        Find a page
        <kbd className="font-mono text-[11px]">⌘K</kbd>
      </button>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Find a page"
        overlayClassName="fixed inset-0 z-50 bg-ink/10 backdrop-blur-[6px]"
        contentClassName="fixed left-1/2 top-[18vh] z-50 w-[min(600px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-card border border-line bg-raised shadow-2xl"
      >
        <Command.Input autoFocus placeholder="Type a title or topic" className="h-14 w-full border-b border-line bg-transparent px-5 text-[16px] text-ink placeholder:text-ink-3 outline-none" />
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-6 text-[14px] text-ink-3">No page matches. Try Ask for a full answer.</Command.Empty>
          {pages.map((p) => (
            <Command.Item
              key={p.slug}
              value={`${p.title} ${p.summary}`}
              onSelect={() => {
                setOpen(false);
                router.push(`/app/wiki/${p.slug}`);
              }}
              className="flex cursor-pointer flex-col gap-0.5 rounded-tile px-4 py-3 data-[selected=true]:bg-tint"
            >
              <span className="flex justify-between gap-3 text-[15px] text-ink">
                {p.title}
                <span className="label">{PAGE_TYPE_LABEL[p.type]}</span>
              </span>
              <span className="line-clamp-1 text-[13px] text-ink-3">{p.summary}</span>
            </Command.Item>
          ))}
        </Command.List>
      </Command.Dialog>
    </>
  );
}

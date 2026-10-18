"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Label, buttonClass } from "@/components/ui";

export function DocumentActions({ id, markdown, notionReady }: { id: string; markdown: string; notionReady: boolean }) {
  const [status, setStatus] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Label className="mb-1">Export</Label>
      <a href={`/api/documents/${id}/export?format=docx`} className={buttonClass("tile")}>
        Word (.docx)
      </a>
      <a href={`/api/documents/${id}/export?format=md`} className={buttonClass("tile")}>
        Markdown
      </a>
      <Button
        variant="tile"
        onClick={async () => {
          await navigator.clipboard.writeText(markdown);
          setStatus("Copied the markdown.");
        }}
      >
        Copy text
      </Button>
      {notionReady ? (
        <Button
          variant="tile"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setStatus("");
            const res = await fetch(`/api/documents/${id}/notion`, { method: "POST" });
            const json = await res.json();
            setBusy(false);
            if (res.ok) setNotionUrl(json.url);
            else setStatus(json.error);
          }}
        >
          {busy ? "Sending" : "Send to Notion"}
        </Button>
      ) : (
        <Link href="/app/settings" className="pt-1 text-[13px] text-ink-3 underline underline-offset-4 hover:text-ink">
          Connect Notion
        </Link>
      )}
      {notionUrl && (
        <a href={notionUrl} target="_blank" rel="noreferrer" className="text-[13px] text-ink-2 hover:text-ink">
          Open in Notion ↗
        </a>
      )}
      {status && <p className="text-[13px] text-ink-3">{status}</p>}
    </div>
  );
}

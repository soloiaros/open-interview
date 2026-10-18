"use client";
import { useState } from "react";
import { Button, Field, GhostButton, Input, Label, TextArea } from "@/components/ui";

type S = { wikiSchema: string; interviewerNotes: string; glossary: string; notionParentPageId: string };

export function SettingsForm({ initial, notionConnected, apiKeyPrefix, mcpUrl }: { initial: S; notionConnected: boolean; apiKeyPrefix: string | null; mcpUrl: string }) {
  const [s, setS] = useState(initial);
  const [notionToken, setNotionToken] = useState("");
  const [saved, setSaved] = useState("");
  const [key, setKey] = useState("");
  const set = (k: keyof S) => (e: { target: { value: string } }) => setS({ ...s, [k]: e.target.value });

  async function save(section: string, data: Record<string, string>) {
    setSaved("");
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    setSaved(res.ok ? section : "error");
  }

  return (
    <div className="flex flex-col gap-16">
      <Section title="Interviewer" note={saved === "interviewer" ? "Saved." : undefined}>
        <Field label="Notes for the interviewer" hint="Questions your interviews tend to miss. One per line.">
          <TextArea value={s.interviewerNotes} onChange={set("interviewerNotes")} placeholder="Ask who signs off on supplier changes." />
        </Field>
        <Field label="Vocabulary" hint="Names, product codes, and jargon. Helps the voice transcription spell them right.">
          <TextArea value={s.glossary} onChange={set("glossary")} placeholder="Brightwater, PPAP, CMM, Halden Metals" className="min-h-20" />
        </Field>
        <Button variant="tile" className="w-fit" onClick={() => save("interviewer", { interviewerNotes: s.interviewerNotes, glossary: s.glossary })}>
          Save interviewer settings
        </Button>
      </Section>

      <Section title="Wiki rules" note={saved === "wiki" ? "Saved." : undefined}>
        <Field label="How pages should be written" hint="The wiki follows these on every update.">
          <TextArea value={s.wikiSchema} onChange={set("wikiSchema")} placeholder="Name the owning team on every how-to. Use metric units." />
        </Field>
        <Button variant="tile" className="w-fit" onClick={() => save("wiki", { wikiSchema: s.wikiSchema })}>
          Save wiki rules
        </Button>
      </Section>

      <Section title="Notion" note={saved === "notion" ? "Connected." : undefined}>
        <p className="text-[14px] text-ink-3">
          Create an internal integration at notion.so/my-integrations, share a parent page with it, then paste both below. {notionConnected && "A token is already saved."}
        </p>
        <Field label="Integration token">
          <Input type="password" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} placeholder={notionConnected ? "Saved. Paste a new one to replace it." : "ntn_…"} />
        </Field>
        <Field label="Parent page ID" hint="The last 32 characters of the page URL.">
          <Input value={s.notionParentPageId} onChange={set("notionParentPageId")} placeholder="1f0c5d7e9a2b4c6d8e0f1a2b3c4d5e6f" />
        </Field>
        <Button variant="tile" className="w-fit" onClick={() => save("notion", { ...(notionToken ? { notionToken } : {}), notionParentPageId: s.notionParentPageId })}>
          Save Notion connection
        </Button>
      </Section>

      <Section title="API and MCP">
        <p className="text-[14px] text-ink-3">
          Connect Claude, Cursor, or any MCP client to your wiki. Tools: search_wiki, get_page, list_pages, ask, create_document.
        </p>
        <div className="flex flex-col gap-2 rounded-tile bg-surface p-4 font-mono text-[12px] text-ink-2">
          <span>URL {mcpUrl}</span>
          <span>Header Authorization: Bearer {key || (apiKeyPrefix ? `${apiKeyPrefix}…` : "<create a key>")}</span>
        </div>
        {key && <p className="text-[13px] text-accent">Copy this key now. It won't be shown again.</p>}
        <GhostButton
          className="w-fit"
          onClick={async () => {
            const res = await fetch("/api/settings/api-key", { method: "POST" });
            if (res.ok) setKey((await res.json()).key);
          }}
        >
          {apiKeyPrefix ? "Rotate key" : "Create key"}
        </GhostButton>
      </Section>
      {saved === "error" && <p className="text-[14px] text-danger">Couldn't save. Try again.</p>}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <Label className="text-ink-2">{title}</Label>
        {note && <span className="font-mono text-[11px] uppercase text-accent">{note}</span>}
      </div>
      {children}
    </section>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { INTERVIEW_MODES, MODE_LABELS, type InterviewMode } from "@/lib/constants";
import { Button, Field, Input, TextArea } from "@/components/ui";
import { cn } from "@/lib/cn";

export function NewInterviewForm({ defaultExpert }: { defaultExpert: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<InterviewMode>("after_action_review");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = refs.current[INTERVIEW_MODES.indexOf(mode)];
    if (el) setBox({ top: el.offsetTop, height: el.offsetHeight });
  }, [mode]);

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode,
        title: String(form.get("title") || "").trim() || String(form.get("goal")).slice(0, 80),
        area: form.get("area") ?? "",
        goal: form.get("goal"),
        background: form.get("background") ?? "",
        expertName: form.get("expertName") ?? defaultExpert,
        checklist: String(form.get("checklist") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setError(json.error ?? "Couldn't create the interview.");
    }
    router.push(`/app/interview/${json.id}`);
  }

  return (
    <form action={submit} className="flex flex-col gap-10">
      <fieldset className="flex flex-col gap-3">
        <legend className="label mb-3">Type</legend>
        <div className="relative flex flex-col">
          {box && <span aria-hidden className="absolute inset-x-0 rounded-tile bg-tint transition-[top,height] duration-300 ease-[cubic-bezier(0.3,0.9,0.3,1)]" style={box} />}
          {INTERVIEW_MODES.map((m, i) => (
            <button
              type="button"
              key={m}
              ref={(el) => {
                refs.current[i] = el;
              }}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className="relative grid cursor-pointer grid-cols-[1fr_auto] items-baseline gap-4 rounded-tile px-5 py-4 text-left"
            >
              <span className="flex flex-col gap-0.5">
                <span className={cn("text-[16px] transition-colors", mode === m ? "text-ink" : "text-ink-2")}>{MODE_LABELS[m].label}</span>
                <span className="text-[13px] text-ink-3">{MODE_LABELS[m].blurb}</span>
              </span>
              <span className={cn("font-mono text-[11px] transition-opacity", mode === m ? "opacity-100" : "opacity-0")}>●</span>
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Goal" hint="One specific thing this session should capture.">
        <Input name="goal" required minLength={5} autoFocus placeholder="Why the Q3 supplier switch slipped six weeks, and what we'd do differently" />
      </Field>
      <details className="group flex flex-col gap-6 [&[open]>summary]:mb-6">
        <summary className="label w-fit cursor-pointer list-none text-ink-2 hover:text-ink">
          <span className="group-open:hidden">+ More details</span>
          <span className="hidden group-open:inline">− Fewer details</span>
        </summary>
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
            <Field label="Title" hint="Defaults to the goal.">
              <Input name="title" placeholder="Q3 supplier switch at the Leeds plant" />
            </Field>
            <Field label="Area">
              <Input name="area" placeholder="Procurement" />
            </Field>
          </div>
          <Field label="Background" hint="Context the interviewer should know.">
            <TextArea name="background" placeholder="We moved castings from Halden Metals to Brightwater in July. Two batches failed incoming inspection." />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Expert">
              <Input name="expertName" defaultValue={defaultExpert} />
            </Field>
            <Field label="Must cover" hint="One item per line.">
              <TextArea name="checklist" className="min-h-12" placeholder="Inspection sampling plan" />
            </Field>
          </div>
        </div>
      </details>
      {error && <p className="text-[14px] text-danger">{error}</p>}
      <Button type="submit" disabled={busy}>
        {busy ? "Planning topics" : "Start interview"}
      </Button>
    </form>
  );
}

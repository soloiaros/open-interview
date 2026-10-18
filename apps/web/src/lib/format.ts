export const clock = (ms: number | null | undefined) =>
  ms == null ? "" : `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export function when(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  const today = new Date();
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === today.toDateString()) return `today ${time}`;
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return `yesterday ${time}`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const PAGE_TYPE_LABEL: Record<string, string> = {
  overview: "Overview",
  decision: "Decision",
  concept: "Concept",
  best_practice: "Best practice",
  how_to: "How-to",
  insight: "Insight",
  entity: "Entity",
};

// Finds a model-provided quote in the source text. A claim without a matching quote never reaches the wiki.

const norm = (c: string) => (/[\s ]/.test(c) ? " " : c.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"'));

/** Builds a normalized copy of `text` plus a map from normalized index to original index. */
function normalize(text: string) {
  let out = "";
  const map: number[] = [];
  let prevSpace = false;
  for (let i = 0; i < text.length; i++) {
    const c = norm(text[i]);
    if (c === " ") {
      if (prevSpace) continue;
      prevSpace = true;
    } else prevSpace = false;
    out += c;
    map.push(i);
  }
  return { out, map };
}

const words = (s: string) => s.toLowerCase().match(/[a-z0-9']+/g) ?? [];

export function locateQuote(source: string, quote: string): { start: number; end: number } | null {
  const q = normalize(quote.trim()).out.replace(/^[\s"'.,;:]+|[\s"'.,;:]+$/g, "");
  if (q.length < 8) return null;
  const { out, map } = normalize(source);
  const idx = out.indexOf(q);
  if (idx >= 0) return { start: map[idx], end: map[idx + q.length - 1] + 1 };

  // Fallback: the model fixed punctuation or casing. Match on word sequence, allowing one word of drift.
  const qw = words(q);
  if (qw.length < 4) return null;
  const sourceWords: { w: string; start: number; end: number }[] = [];
  for (const m of source.matchAll(/[A-Za-z0-9']+/g)) sourceWords.push({ w: m[0].toLowerCase(), start: m.index!, end: m.index! + m[0].length });
  const allowed = qw.length >= 6 ? 1 : 0;
  for (let i = 0; i + qw.length <= sourceWords.length; i++) {
    let mismatches = 0;
    for (let j = 0; j < qw.length && mismatches <= allowed; j++) if (sourceWords[i + j].w !== qw[j]) mismatches++;
    if (mismatches <= allowed) {
      return { start: sourceWords[i].start, end: sourceWords[i + qw.length - 1].end };
    }
  }
  return null;
}

// Minimal markdown to block list. Covers what the generators emit: headings, lists, to-dos, quotes, code, paragraphs.
export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "bullet" | "number" | "quote" | "paragraph"; text: string }
  | { kind: "todo"; text: string; checked: boolean }
  | { kind: "code"; lang: string; text: string };

export function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ kind: "paragraph", text: para.join(" ") });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      flush();
      const body: string[] = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) body.push(lines[i]);
      out.push({ kind: "code", lang: fence[1] || "plain", text: body.join("\n") });
      continue;
    }
    let m: RegExpMatchArray | null;
    if (!line.trim()) flush();
    else if ((m = line.match(/^(#{1,3})\s+(.*)/))) {
      flush();
      out.push({ kind: "heading", level: m[1].length as 1 | 2 | 3, text: m[2] });
    } else if ((m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)/))) {
      flush();
      out.push({ kind: "todo", checked: m[1] !== " ", text: m[2] });
    } else if ((m = line.match(/^\s*[-*]\s+(.*)/))) {
      flush();
      out.push({ kind: "bullet", text: m[1] });
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) {
      flush();
      out.push({ kind: "number", text: m[1] });
    } else if ((m = line.match(/^>\s?(.*)/))) {
      flush();
      out.push({ kind: "quote", text: m[1] });
    } else if (/^\|?\s*:?-{3,}/.test(line)) continue;
    else para.push(line.trim());
  }
  flush();
  return out;
}

/** Splits **bold** runs for rich text renderers. */
export function inlineRuns(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((t) => (t.startsWith("**") && t.endsWith("**") ? { text: t.slice(2, -2), bold: true } : { text: t.replace(/`/g, ""), bold: false }));
}

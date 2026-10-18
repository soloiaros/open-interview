import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { Citation } from "@/db/app-schema";
import { inlineRuns, parseBlocks } from "@/lib/mdblocks";

const runs = (text: string) => inlineRuns(text).map((r) => new TextRun({ text: r.text, bold: r.bold }));
const HEADINGS = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 } as const;

export async function markdownToDocx(md: string, citations: Citation[] = []): Promise<Buffer> {
  const children: Paragraph[] = [];
  for (const b of parseBlocks(md)) {
    if (b.kind === "heading") children.push(new Paragraph({ heading: HEADINGS[b.level], children: runs(b.text) }));
    else if (b.kind === "bullet") children.push(new Paragraph({ bullet: { level: 0 }, children: runs(b.text) }));
    else if (b.kind === "number") children.push(new Paragraph({ numbering: { reference: "num", level: 0 }, children: runs(b.text) }));
    else if (b.kind === "todo") children.push(new Paragraph({ children: [new TextRun(b.checked ? "☑ " : "☐ "), ...runs(b.text)] }));
    else if (b.kind === "quote") children.push(new Paragraph({ indent: { left: 480 }, children: [new TextRun({ text: b.text, italics: true })] }));
    else if (b.kind === "code") for (const l of b.text.split("\n")) children.push(new Paragraph({ children: [new TextRun({ text: l, font: "Courier New", size: 18 })] }));
    else children.push(new Paragraph({ spacing: { after: 160 }, children: runs(b.text) }));
  }
  if (citations.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Sources")] }));
    for (const c of citations) children.push(new Paragraph({ children: [new TextRun(`[${c.n}] ${c.title}${c.kind === "evidence" ? ` - "${c.quote.slice(0, 160)}"` : ""}`)] }));
  }
  const doc = new Document({
    styles: { default: { document: { run: { font: "Helvetica", size: 22 } } } },
    numbering: { config: [{ reference: "num", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start" }] }] },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

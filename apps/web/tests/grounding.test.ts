import assert from "node:assert/strict";
import { test } from "node:test";
import { locateQuote } from "../src/lib/grounding";
import { parseBlocks } from "../src/lib/mdblocks";

const src = `INTERVIEWER: What happened with the second batch?
EXPERT: We caught it at incoming inspection. The wall thickness was off by 0.4 mm on about a third of the castings, so we quarantined the lot.
INTERVIEWER: Who decided?
EXPERT: Priya from quality made the call, and honestly that's the right person every time.`;

test("exact quote resolves to the original span", () => {
  const q = "The wall thickness was off by 0.4 mm on about a third of the castings";
  const loc = locateQuote(src, q)!;
  assert.equal(src.slice(loc.start, loc.end), q);
});

test("quote with fixed casing, curly quotes and whitespace still resolves", () => {
  const loc = locateQuote(src, "priya from quality made the call, and honestly that’s   the right person")!;
  assert.ok(loc);
  assert.ok(src.slice(loc.start, loc.end).startsWith("Priya from quality"));
});

test("one changed word in a long quote resolves via word match", () => {
  const loc = locateQuote(src, "we caught it during incoming inspection. The wall thickness was off");
  assert.ok(loc);
});

test("invented quote is rejected", () => {
  assert.equal(locateQuote(src, "We switched suppliers because Halden was cheaper"), null);
});

test("too-short quote is rejected", () => {
  assert.equal(locateQuote(src, "Priya"), null);
});

test("markdown blocks: headings, lists, todos, code", () => {
  const blocks = parseBlocks("# Title\n\nIntro line\ncontinues.\n\n## Steps\n1. First\n2. Second\n- [x] done\n- [ ] open\n- bullet\n\n```mermaid\nflowchart TD\nA-->B\n```\n> quote");
  assert.deepEqual(
    blocks.map((b) => b.kind),
    ["heading", "paragraph", "heading", "number", "number", "todo", "todo", "bullet", "code", "quote"],
  );
  assert.equal(blocks[1].kind === "paragraph" && blocks[1].text, "Intro line continues.");
});

import { Client } from "@notionhq/client";
import { inlineRuns, parseBlocks, type Block } from "@/lib/mdblocks";

type NotionBlock = Record<string, unknown>;
const rich = (text: string) =>
  inlineRuns(text).flatMap((r) => {
    const parts: string[] = [];
    for (let i = 0; i < r.text.length; i += 1900) parts.push(r.text.slice(i, i + 1900));
    return parts.map((content) => ({ type: "text", text: { content }, annotations: { bold: r.bold } }));
  });

function toNotion(b: Block): NotionBlock {
  switch (b.kind) {
    case "heading": {
      const t = `heading_${b.level}`;
      return { object: "block", type: t, [t]: { rich_text: rich(b.text) } };
    }
    case "bullet":
      return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: rich(b.text) } };
    case "number":
      return { object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: rich(b.text) } };
    case "todo":
      return { object: "block", type: "to_do", to_do: { rich_text: rich(b.text), checked: b.checked } };
    case "quote":
      return { object: "block", type: "quote", quote: { rich_text: rich(b.text) } };
    case "code":
      return { object: "block", type: "code", code: { rich_text: rich(b.text), language: b.lang === "mermaid" ? "mermaid" : "plain text" } };
    default:
      return { object: "block", type: "paragraph", paragraph: { rich_text: rich(b.text) } };
  }
}

/** Creates a Notion page under the configured parent page. Returns its URL. */
export async function exportToNotion(opts: { token: string; parentPageId: string; title: string; markdown: string }) {
  const notion = new Client({ auth: opts.token });
  const blocks = parseBlocks(opts.markdown.replace(/^# .*\n/, "")).map(toNotion);
  const created = (await notion.pages.create({
    parent: { page_id: opts.parentPageId },
    properties: { title: { title: [{ text: { content: opts.title.slice(0, 200) } }] } },
    children: blocks.slice(0, 100) as never,
  })) as { id: string; url?: string };
  for (let i = 100; i < blocks.length; i += 100)
    await notion.blocks.children.append({ block_id: created.id, children: blocks.slice(i, i + 100) as never });
  return created.url ?? `https://www.notion.so/${created.id.replace(/-/g, "")}`;
}

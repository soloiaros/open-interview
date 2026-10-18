import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { link, page } from "@/db/schema";
import { WikiGraph } from "@/components/wiki/graph";
import { Label } from "@/components/ui";
import { requireContext } from "@/lib/context";

export default async function GraphPage() {
  const ctx = await requireContext();
  const nodes = await db.select({ id: page.id, title: page.title, slug: page.slug, type: page.type }).from(page).where(eq(page.orgId, ctx.orgId));
  const edges = nodes.length ? await db.select().from(link).where(inArray(link.fromPageId, nodes.map((n) => n.id))) : [];
  return (
    <div className="flex flex-col gap-6">
      <Label>
        {nodes.length} pages · {edges.length} links
      </Label>
      <WikiGraph nodes={nodes} links={edges.map((e) => ({ source: e.fromPageId, target: e.toPageId }))} />
    </div>
  );
}

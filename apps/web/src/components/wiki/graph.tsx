"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type N = { id: string; title: string; slug: string; type: string };

const LIGHT = { background: "#ffffff", link: "#1212121f", node: "#121212", label: "#121212b8", accent: "#0080ff" };

export function WikiGraph({ nodes, links }: { nodes: N[]; links: { source: string; target: string }[] }) {
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [paint, setPaint] = useState(LIGHT);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: Math.max(480, window.innerHeight - 260) }));
    ro.observe(el);
    const s = getComputedStyle(document.documentElement);
    const pick = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
    setPaint({
      background: pick("--color-surface", LIGHT.background),
      link: pick("--color-line", LIGHT.link),
      node: pick("--color-ink", LIGHT.node),
      label: pick("--color-ink-2", LIGHT.label),
      accent: pick("--color-accent", LIGHT.accent),
    });
    return () => ro.disconnect();
  }, []);

  if (!nodes.length) return <p className="text-ink-3">The graph appears once the wiki has pages.</p>;

  return (
    <div ref={wrap} className="overflow-hidden rounded-card bg-surface">
      <ForceGraph2D
        width={size.w}
        height={size.h}
        graphData={{ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) }}
        backgroundColor={paint.background}
        linkColor={() => paint.link}
        nodeRelSize={4}
        cooldownTicks={120}
        onNodeClick={(n) => router.push(`/app/wiki/${(n as N).slug}`)}
        nodeCanvasObject={(n, ctx, scale) => {
          const node = n as N & { x: number; y: number };
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = node.type === "decision" ? paint.accent : paint.node;
          ctx.fill();
          if (scale > 1.2) {
            ctx.font = `${11 / scale}px "TeX Gyre Heros", Helvetica, sans-serif`;
            ctx.fillStyle = paint.label;
            ctx.fillText(node.title, node.x + 6, node.y + 3);
          }
        }}
      />
    </div>
  );
}

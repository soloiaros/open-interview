"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpen, FilePlus2, MessageCircle, Mic, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/app", label: "Interviews", icon: Mic, match: (p: string) => p === "/app" || p.startsWith("/app/interview") },
  { href: "/app/wiki", label: "Wiki", icon: BookOpen, match: (p: string) => p.startsWith("/app/wiki") },
  { href: "/app/chat", label: "Ask", icon: MessageCircle, match: (p: string) => p.startsWith("/app/chat") },
  { href: "/app/create", label: "Create", icon: FilePlus2, match: (p: string) => p.startsWith("/app/create") || p.startsWith("/app/documents") },
  { href: "/app/settings", label: "Settings", icon: SlidersHorizontal, match: (p: string) => p.startsWith("/app/settings") },
];

const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

// The old floating pill, turned on its side: frosted bar, icon over label, one sliding indicator.
// Icons only until hover, then it widens into the labeled bar.
export function TabBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [panel, setPanel] = useState(false);
  const [shown, setShown] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      setPanel(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = window.setTimeout(() => setPanel(false), 320);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <>
      <div
        className="nav-dock hidden lg:block"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExpanded(false);
        }}
      >
        <Rail expanded={expanded} />
      </div>
      {panel && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className={cn("fixed inset-0 z-40 bg-ink/10 backdrop-blur-[6px] transition-opacity duration-300 lg:hidden", shown ? "opacity-100" : "opacity-0")}
            style={{ transitionTimingFunction: EASE }}
          />
          <div
            className={cn(
              "fixed top-1/2 right-[var(--page-pad)] z-50 -translate-y-1/2 transition-opacity duration-300 lg:hidden",
              shown ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <div className={cn("transition-transform duration-300", shown ? "translate-x-0" : "translate-x-6")} style={{ transitionTimingFunction: EASE }}>
              <Rail id="app-nav" expanded onNavigate={onClose} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Rail({ id, expanded, onNavigate }: { id?: string; expanded: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const nav = useRef<HTMLElement>(null);
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  const active = TABS.findIndex((t) => t.match(pathname));

  useLayoutEffect(() => {
    const root = nav.current;
    if (!root) return;
    const measure = () => {
      const el = refs.current[active];
      if (!el) return setBox(null);
      setBox({ top: el.offsetTop, height: el.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    for (const el of refs.current) if (el) ro.observe(el);
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [active, expanded]);

  useEffect(() => {
    if (id) nav.current?.focus();
  }, [id]);

  return (
    <nav
      ref={nav}
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-label="Main"
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[28px] bg-surface/80 p-1 shadow-[0_4px_16px_-4px_rgba(18,18,18,0.15)] backdrop-blur-[7px] transition-[width] duration-300 outline-none",
        expanded ? "w-[88px]" : "w-12",
      )}
      style={{ transitionTimingFunction: EASE }}
    >
      {box && (
        <span
          aria-hidden
          className={cn("absolute right-1 left-1 rounded-[24px] bg-tint", animate && "transition-[top,height] duration-300 ease-[cubic-bezier(0.3,0.9,0.3,1)]")}
          style={{ top: box.top, height: box.height }}
        />
      )}
      {TABS.map((t, i) => (
        <Link
          key={t.href}
          href={t.href}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-current={i === active ? "page" : undefined}
          onClick={onNavigate}
          className={cn(
            "relative flex flex-col items-center rounded-[24px] px-1 py-3 text-[11px] transition-colors duration-200",
            i === active ? "text-ink" : "text-ink-3 hover:text-ink-2",
          )}
        >
          <t.icon size={18} strokeWidth={1.5} aria-hidden />
          <span
            className="grid transition-[grid-template-rows,opacity,margin] duration-300"
            style={{
              transitionTimingFunction: EASE,
              gridTemplateRows: expanded ? "1fr" : "0fr",
              opacity: expanded ? 1 : 0,
              marginTop: expanded ? 4 : 0,
            }}
          >
            <span className="overflow-hidden leading-none">{t.label}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

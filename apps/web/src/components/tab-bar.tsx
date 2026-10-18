"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { BookOpen, FilePlus2, MessageCircle, Mic, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/app", label: "Interviews", icon: Mic, match: (p: string) => p === "/app" || p.startsWith("/app/interview") },
  { href: "/app/wiki", label: "Wiki", icon: BookOpen, match: (p: string) => p.startsWith("/app/wiki") },
  { href: "/app/chat", label: "Ask", icon: MessageCircle, match: (p: string) => p.startsWith("/app/chat") },
  { href: "/app/create", label: "Create", icon: FilePlus2, match: (p: string) => p.startsWith("/app/create") || p.startsWith("/app/documents") },
  { href: "/app/settings", label: "Settings", icon: SlidersHorizontal, match: (p: string) => p.startsWith("/app/settings") },
];

// App&Flow's floating segmented bar: blurred pill, icon over label, one sliding indicator.
export function TabBar() {
  const pathname = usePathname();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  const active = TABS.findIndex((t) => t.match(pathname));

  useLayoutEffect(() => {
    const el = refs.current[active];
    if (!el) return setBox(null);
    setBox({ left: el.offsetLeft, width: el.offsetWidth });
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [active]);

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="relative flex items-stretch rounded-[28px] bg-[#f0f0f01a] p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.5)] backdrop-blur-[7px]">
        {box && (
          <span
            aria-hidden
            className={cn("absolute top-1 bottom-1 rounded-[24px] bg-tint", animate && "transition-[left,width] duration-300 ease-[cubic-bezier(0.3,0.9,0.3,1)]")}
            style={{ left: box.left, width: box.width }}
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
            className={cn(
              "relative flex w-[76px] flex-col items-center gap-1 rounded-[24px] px-2 py-2.5 text-[11px] transition-colors duration-200 sm:w-[88px]",
              i === active ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            <t.icon size={18} strokeWidth={1.5} aria-hidden />
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

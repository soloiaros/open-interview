"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SignOut } from "@/components/account-menu";
import { TabBar } from "@/components/tab-bar";
import { IconButton } from "@/components/ui";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

export function AppFrame({ orgName, children }: { orgName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 64rem)").matches) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="min-h-dvh">
      <header className={cn("gutter-app sticky top-0 z-30 flex items-center justify-between bg-bg/80 py-4 backdrop-blur-md lg:z-30", open && "z-50")}>
        <Link href="/app" className="display min-w-0 text-[22px] leading-[0.9] sm:text-[26px] sm:leading-none">
          {APP_NAME}
        </Link>
        <div className="flex shrink-0 items-center gap-4 sm:gap-5">
          <span className="hidden text-[13px] text-ink-3 sm:inline">{orgName}</span>
          <SignOut />
          <IconButton type="button" label={open ? "Close menu" : "Menu"} className="lg:hidden" aria-expanded={open} aria-controls="app-nav" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
          </IconButton>
        </div>
      </header>
      <main className="gutter-app mx-auto w-full max-w-[1080px] pt-6 pb-16">{children}</main>
      <TabBar open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

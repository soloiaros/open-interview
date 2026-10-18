import Link from "next/link";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// Primary: App&Flow's 52px inverted pill with the squish hover. Light pill on the dark page.
const primary =
  "inline-flex h-[52px] w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-pill bg-ink px-8 text-[12px] font-bold text-bg origin-bottom transition-[transform,opacity] duration-150 hover:animate-[squish_0.3s_ease-out] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:animate-none";
// Tile: App&Flow's 50px wide button on a 6% tint, radius 16.
const tile =
  "inline-flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-tile bg-tint px-8 text-[13px] text-ink origin-bottom transition-[transform,background-color] duration-150 hover:animate-[squish_0.3s_ease-out] hover:bg-line active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export const buttonClass = (variant: "primary" | "tile" = "primary") => (variant === "primary" ? primary : tile);

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: "primary" | "tile" }) {
  return <button {...p} className={cn(variant === "primary" ? primary : tile, className)} />;
}

export function LinkButton({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: "primary" | "tile" }) {
  return <Link {...p} className={cn(variant === "primary" ? primary : tile, className)} />;
}

// Ghost: App&Flow's dotted SVG pill. Label moves from secondary to primary ink on hover, stroke from 0.5 to 1.
export function GhostButton({ children, className, href, ...p }: ComponentProps<"button"> & { href?: string }) {
  const inner = (
    <>
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <rect width="100%" height="100%" rx="16.5" fill="none" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" className="stroke-ink-2 [stroke-opacity:0.5] transition-[stroke-opacity] duration-300 group-hover:[stroke-opacity:1]" />
      </svg>
      <span className="relative font-mono text-[12px] text-ink-2 transition-colors duration-300 group-hover:text-ink">{children}</span>
    </>
  );
  const cls = cn("group relative inline-flex cursor-pointer items-center justify-center rounded-pill px-4 py-3 disabled:opacity-40", className);
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button {...p} className={cls}>
      {inner}
    </button>
  );
}

export function IconButton({ className, label, ...p }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      {...p}
      aria-label={label}
      title={label}
      className={cn("inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-ink-3 transition-[color,transform,background-color] duration-300 hover:scale-110 hover:bg-tint hover:text-ink disabled:opacity-40", className)}
    />
  );
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div {...p} className={cn("rounded-card bg-surface p-8", className)} />;
}

export function Label({ className, ...p }: ComponentProps<"span">) {
  return <span {...p} className={cn("label", className)} />;
}

export function Badge({ tone = "neutral", className, ...p }: ComponentProps<"span"> & { tone?: "neutral" | "accent" | "danger" }) {
  const tones = { neutral: "bg-tint text-ink-2", accent: "bg-accent-tint text-accent", danger: "bg-danger/15 text-danger" };
  return <span {...p} className={cn("inline-flex h-6 items-center rounded-pill px-2.5 font-mono text-[11px] uppercase tracking-wide", tones[tone], className)} />;
}

const field = "w-full rounded-tile border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-ink-3";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...p }, ref) {
  return <input ref={ref} {...p} className={cn(field, "h-12", className)} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function TextArea({ className, ...p }, ref) {
  return <textarea ref={ref} {...p} className={cn(field, "min-h-28 resize-y py-3 leading-relaxed", className)} />;
});

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-ink-3">{hint}</span>}
    </label>
  );
}

/** Section heading: Instrument Serif uppercase, App&Flow two-tone subline. */
export function PageTitle({ title, lead, rest }: { title: string; lead?: string; rest?: string }) {
  return (
    <header className="flex flex-col gap-4">
      <h1 className="display text-[56px] sm:text-[72px]">{title}</h1>
      {(lead || rest) && (
        <p className="max-w-[52ch] text-[17px] leading-snug">
          {lead && <span className="text-ink">{lead} </span>}
          {rest && <span className="text-ink-3">{rest}</span>}
        </p>
      )}
    </header>
  );
}

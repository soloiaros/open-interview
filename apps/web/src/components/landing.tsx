"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { APP_NAME } from "@/lib/brand";
import { buttonClass } from "@/components/ui";

const STEPS = [
  { n: "01", title: "Talk", text: "An expert answers questions for fifteen minutes, by voice or text. The interviewer follows up when an answer is vague." },
  { n: "02", title: "File", text: "Each session becomes wiki pages for decisions, practices, and how-tos. Every line links to the second it was said." },
  { n: "03", title: "Create", text: "Handovers, SOPs, onboarding guides, training with quizzes, and decision trees, written from the wiki." },
  { n: "04", title: "Ask", text: "New people ask questions and get answers from your own team's experience, with the source attached." },
];

export function Landing({ signedIn }: { signedIn: boolean }) {
  const reduce = useReducedMotion();
  const cta = signedIn ? { href: "/app", label: "Open workspace" } : { href: "/sign-in?mode=sign-up", label: "Start for free" };
  return (
    <div className="min-h-dvh">
      <header className="gutter flex items-center justify-between py-4">
        <Link href="/" className="display min-w-0 text-[22px] leading-[0.9] sm:text-[26px] sm:leading-none">
          {APP_NAME}
        </Link>
        <nav className="shrink-0 text-[13px]">
          <Link href={signedIn ? "/app" : "/sign-in"} className="text-ink-2 transition-colors hover:text-ink">
            {signedIn ? "Workspace" : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="gutter flex flex-col items-start gap-8 pt-16 pb-28 sm:pt-24">
        <h1 className="max-w-[16ch] text-[clamp(36px,5.5vw,64px)] leading-[1.15] tracking-[-0.01em] text-ink">
          Interview the people who know how the work gets done.
        </h1>
        <p className="max-w-[36ch] text-[17px] leading-snug text-ink-2">Keep what they know after they leave.</p>
        <Link href={cta.href} className={buttonClass()}>
          {cta.label}
        </Link>
      </section>

      <section className="gutter pt-8 pb-32">
        <Reveal>
          <p className="max-w-[24ch] text-[clamp(32px,4.4vw,60px)] leading-[1.25] tracking-[-0.01em] text-ink">
            Most of what your team knows lives in a few heads.{" "}
            <span className="serif-i text-ink-2">We sit those people down for fifteen minutes and write it into a wiki that keeps itself current.</span>
          </p>
        </Reveal>
      </section>

      <section className="gutter flex flex-col gap-4 pb-32">
        <Reveal>
          <h2 className="display text-center text-[clamp(72px,14vw,200px)]">How it works</h2>
        </Reveal>
        <ol className="grid gap-4 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ type: "spring", stiffness: 380, damping: 26, delay: (i % 2) * 0.06 }}
              className="flex h-full flex-col gap-10 rounded-[14px] border border-line p-6 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <span className="label">Step</span>
                <span className="serif-i text-[40px] leading-none text-ink">({s.n})</span>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="display text-[56px]">{s.title}</h3>
                <p className="max-w-[40ch] text-[15px] text-ink-2">{s.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="gutter flex flex-col items-start gap-8 pb-40">
        <Reveal>
          <p className="max-w-[34ch] text-[clamp(24px,2.6vw,36px)] leading-[1.35] text-ink">
            Open source. Runs on your own servers in the EU, or anywhere you like.{" "}
            <span className="text-ink-2">Your interviews never train a model.</span>
          </p>
        </Reveal>
        <Link href={cta.href} className={buttonClass()}>
          {cta.label}
        </Link>
      </section>

      <footer className="gutter flex items-center justify-between border-t border-line py-6 font-mono text-[11px] uppercase text-ink-2">
        <span>{APP_NAME}</span>
        <span>Interviews · Wiki · Documents · Answers</span>
      </footer>
    </div>
  );
}

/** Scroll-triggered entrance, played once. */
function Reveal({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

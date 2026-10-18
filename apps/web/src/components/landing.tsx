"use client";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  const hero = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const [endScale, setEndScale] = useState(0.1);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });

  // The wordmark shrinks along the scroll into the 26px nav logo. Same element, transform only.
  useEffect(() => {
    const measure = () => mark.current && setEndScale(26 / parseFloat(getComputedStyle(mark.current).fontSize));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const scale = useTransform(scrollYProgress, [0, 0.9], [1, endScale]);
  const y = useTransform(scrollYProgress, [0, 0.9], ["14vh", "0vh"]);
  // Intro and button clear out before they scroll under the shrinking wordmark.
  const navBg = useTransform(scrollYProgress, [0.82, 0.95], [0, 1]);
  const introOpacity = useTransform(scrollYProgress, [0.04, 0.28], [1, 0]);

  const cta1 = signedIn ? { href: "/app", label: "Open workspace" } : { href: "/sign-in?mode=sign-up", label: "Start for free" };

  return (
    <div className="min-h-dvh">
      <header className="fixed inset-x-0 top-0 z-40 flex items-start justify-between px-6 py-4">
        <motion.div aria-hidden style={{ opacity: reduce ? 1 : navBg }} className="absolute inset-x-0 top-0 -z-10 h-[64px] bg-bg/85 backdrop-blur-md" />
        <motion.span
          ref={mark}
          aria-label={APP_NAME}
          className="display block origin-top-left text-[46vw] leading-[0.8] tracking-[-0.02em] will-change-transform"
          style={reduce ? { fontSize: 26 } : { scale, y }}
        >
          <Link href="/">{APP_NAME}</Link>
        </motion.span>
        <nav className="flex items-center gap-6 pt-1 text-[13px]">
          <Link href={signedIn ? "/app" : "/sign-in"} className="text-ink-2 transition-colors hover:text-ink">
            {signedIn ? "Workspace" : "Sign in"}
          </Link>
        </nav>
      </header>

      <div ref={hero} className="relative h-dvh">
        <motion.div style={reduce ? undefined : { opacity: introOpacity }} className="flex h-full flex-col justify-end gap-6 px-6 pb-10">
          <p className="max-w-[30ch] text-[17px] leading-snug text-ink-2">Interview the people who know how things work. Keep what they know after they leave.</p>
          <Link href={cta1.href} className={buttonClass()}>
            {cta1.label}
          </Link>
        </motion.div>
      </div>

      <section className="px-6 pt-24 pb-32">
        <Reveal>
          <p className="max-w-[24ch] text-[clamp(32px,4.4vw,60px)] leading-[1.25] tracking-[-0.01em] text-ink">
            Most of what your team knows lives in a few heads.{" "}
            <span className="serif-i text-ink-2">We sit those people down for fifteen minutes and write it into a wiki that keeps itself current.</span>
          </p>
        </Reveal>
      </section>

      <section className="flex flex-col gap-4 px-6 pb-32">
        <Reveal>
          <h2 className="display text-center text-[clamp(72px,14vw,200px)]">How it works</h2>
        </Reveal>
        <ol className="grid gap-4 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 28 }}
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

      <section className="flex flex-col items-start gap-8 px-6 pb-40">
        <Reveal>
          <p className="max-w-[34ch] text-[clamp(24px,2.6vw,36px)] leading-[1.35] text-ink">
            Open source. Runs on your own servers in the EU, or anywhere you like.{" "}
            <span className="text-ink-2">Your interviews never train a model.</span>
          </p>
        </Reveal>
        <Link href={cta1.href} className={buttonClass()}>
          {cta1.label}
        </Link>
      </section>

      <footer className="flex items-center justify-between border-t border-line px-6 py-6 font-mono text-[11px] uppercase text-ink-2">
        <span>{APP_NAME}</span>
        <span>Interviews · Wiki · Documents · Answers</span>
      </footer>
    </div>
  );
}

/** Scroll-triggered entrance, played once. */
function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-12% 0px" }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

"use client";

import { motion, MotionConfig, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { ReceiptPreview } from "@/components/ReceiptPreview";

const stats = [
  "5+ vendors compared",
  "Buy-now / wait signal",
  "Roommate cost split",
];

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const line: Variants = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

function RevealLine({ children }: { children: ReactNode }) {
  return (
    <span className="block overflow-hidden pb-1">
      <motion.span variants={line} className="block">
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={container}
        className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <div className="space-y-6">
          <motion.p
            variants={item}
            className="font-mono text-xs uppercase tracking-[0.2em] text-purple"
          >
            Wildcat Welcome &middot; Class of 2030
          </motion.p>

          <h1 className="max-w-2xl font-display text-5xl leading-[1.08] text-ink sm:text-6xl">
            <RevealLine>Stop overpaying on</RevealLine>
            <RevealLine>
              <em className="text-purple">the same purchases</em>
            </RevealLine>
            <RevealLine>every incoming Wildcat makes.</RevealLine>
          </h1>

          <motion.p
            variants={item}
            className="max-w-xl text-base leading-relaxed text-ink-soft"
          >
            One engine covers textbooks and dorm essentials: side-by-side
            prices from Norris, Amazon, Chegg, and more, plus a
            plain-language read on whether to buy now or wait. Built for
            the Class of 2030 moving into Evanston this fall.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-wrap gap-x-5 gap-y-2 pt-1"
          >
            {stats.map((s) => (
              <span
                key={s}
                className="font-mono text-[11px] uppercase tracking-wide text-ink-faint"
              >
                {s}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div variants={item}>
          <ReceiptPreview />
        </motion.div>
      </motion.section>
    </MotionConfig>
  );
}

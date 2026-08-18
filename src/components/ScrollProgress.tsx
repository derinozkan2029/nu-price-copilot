"use client";

// From motion-primitives (https://motion-primitives.com/docs/scroll-progress),
// with `layoutEffect` dropped from the useScroll call below: that option
// isn't in the type for the `motion` version this project has installed
// (the upstream source targets a different version), and this project
// never passes containerRef anyway, so it has no effect either way.
import { motion, SpringOptions, useScroll, useSpring } from "motion/react";
import { cn } from "@/lib/utils";
import { RefObject } from "react";

export type ScrollProgressProps = {
  className?: string;
  springOptions?: SpringOptions;
  containerRef?: RefObject<HTMLDivElement>;
};

const DEFAULT_SPRING_OPTIONS: SpringOptions = {
  stiffness: 200,
  damping: 50,
  restDelta: 0.001,
};

export function ScrollProgress({
  className,
  springOptions,
  containerRef,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const scaleX = useSpring(scrollYProgress, {
    ...DEFAULT_SPRING_OPTIONS,
    ...(springOptions ?? {}),
  });

  return (
    <motion.div
      className={cn("inset-x-0 top-0 h-1 origin-left", className)}
      style={{
        scaleX,
      }}
    />
  );
}

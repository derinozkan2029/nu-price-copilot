"use client";

import { SlidingNumber } from "@/components/SlidingNumber";

// SlidingNumber renders `value.toString()`, which drops trailing zero cents
// ($5.5 instead of $5.50). Splitting into dollars/cents and padding cents
// to two digits keeps currency formatting correct while still animating.
export function AnimatedPrice({ value }: { value: number }) {
  const rounded = Math.round(value * 100) / 100;
  const dollars = Math.floor(rounded);
  const cents = Math.round((rounded - dollars) * 100);

  return (
    <span className="inline-flex items-center tabular-nums">
      $
      <SlidingNumber value={dollars} />.
      <SlidingNumber value={cents} padStart />
    </span>
  );
}

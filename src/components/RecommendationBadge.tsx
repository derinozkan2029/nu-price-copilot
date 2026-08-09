import type { RecommendationSignal } from "@/types";

export function RecommendationBadge({
  signal,
  rationale,
}: {
  signal: RecommendationSignal;
  rationale: string;
}) {
  const isBuyNow = signal === "buy_now";

  return (
    <div
      className={`flex gap-3 rounded-lg border-l-[3px] bg-paper-raised p-4 ${
        isBuyNow ? "border-emerald" : "border-amber"
      }`}
    >
      <div className="min-w-0">
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] ${
            isBuyNow ? "text-emerald-deep" : "text-amber-deep"
          }`}
        >
          <span aria-hidden>{isBuyNow ? "↑" : "→"}</span>
          {isBuyNow ? "Buy now" : "Worth waiting"}
        </span>
        <p className="mt-1.5 font-display text-[15px] italic leading-snug text-ink">
          {rationale}
        </p>
      </div>
    </div>
  );
}

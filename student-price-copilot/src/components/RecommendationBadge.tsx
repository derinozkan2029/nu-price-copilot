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
      className={`rounded-lg border p-4 ${
        isBuyNow
          ? "border-green-200 bg-green-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
          isBuyNow ? "bg-green-600 text-white" : "bg-amber-500 text-white"
        }`}
      >
        {isBuyNow ? "Buy now" : "Worth waiting"}
      </span>
      <p className="mt-2 text-sm text-slate-700">{rationale}</p>
    </div>
  );
}

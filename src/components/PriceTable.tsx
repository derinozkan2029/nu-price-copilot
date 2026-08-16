import type { VendorPrice } from "@/lib/bookscouter";

export function PriceTable({ prices }: { prices: VendorPrice[] }) {
  const sorted = [...prices].sort((a, b) => a.price - b.price);
  const lowest = sorted[0]?.price;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper-raised">
      <div className="flex items-center gap-4 border-b border-line px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
        <span className="flex-1">Vendor</span>
        <span className="w-20">Format</span>
        <span className="w-20 text-right">Price</span>
      </div>
      <div>
        {sorted.map((p, i) => {
          const isBest = p.price === lowest;
          return (
            <div
              key={`${p.vendor}-${i}`}
              className={`flex items-center gap-4 border-b border-dashed border-line-soft px-4 py-3 text-sm last:border-b-0 ${
                isBest ? "bg-purple-soft" : ""
              }`}
            >
              <span
                className={`flex-1 border-l-2 pl-3 ${
                  isBest
                    ? "border-purple font-medium text-purple-deep"
                    : "border-transparent text-ink"
                }`}
              >
                {p.vendor}
                {isBest && (
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-purple">
                    best
                  </span>
                )}
              </span>
              <span className="w-20 font-mono text-xs capitalize text-ink-soft">
                {p.format ?? "—"}
              </span>
              <span
                className={`w-20 text-right font-mono tabular-nums ${
                  isBest ? "font-semibold text-purple-deep" : "text-ink"
                }`}
              >
                ${p.price.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

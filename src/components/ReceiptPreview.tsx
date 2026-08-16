const lines = [
  { vendor: "NORRIS BOOKSTORE", price: "118.00" },
  { vendor: "AMAZON (USED)", price: "96.50" },
  { vendor: "CHEGG (RENTAL)", price: "41.30", best: true },
];

export function ReceiptPreview() {
  return (
    <div className="hidden select-none justify-self-end sm:block">
      <div className="relative w-64 rotate-[3deg] rounded-sm bg-paper-raised px-5 pb-8 pt-6 font-mono text-xs text-ink shadow-[0_18px_40px_-14px_rgba(27,24,18,0.35)] tear-edge">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
          NU Price Copilot
        </p>
        <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-ink-faint">
          ISBN 9780134685991
        </p>

        <div className="mt-4 border-t border-dashed border-line pt-3">
          {lines.map((l) => (
            <div
              key={l.vendor}
              className={`flex items-baseline justify-between py-1 ${
                l.best ? "text-purple-deep" : "text-ink-soft"
              }`}
            >
              <span className="truncate">{l.vendor}</span>
              <span className="ml-2 shrink-0 tabular-nums">${l.price}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-line pt-3 font-semibold text-ink">
          <span className="text-[11px] uppercase tracking-wide">
            You save
          </span>
          <span className="tabular-nums">$76.70</span>
        </div>

        <div className="pointer-events-none absolute -bottom-3 -right-3 rotate-[-8deg] rounded-sm border-2 border-purple px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-purple opacity-80 animate-stamp">
          Buy now
        </div>
      </div>
    </div>
  );
}

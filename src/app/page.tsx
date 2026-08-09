import Link from "next/link";
import { ReceiptPreview } from "@/components/ReceiptPreview";

const stats = [
  "5+ vendors compared",
  "Buy-now / wait signal",
  "Roommate cost split",
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="animate-fade-up space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
            Price intelligence for students
          </p>
          <h1 className="max-w-2xl font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
            Stop overpaying on the
            <br />
            <em className="text-emerald">same purchases</em>, every semester.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink-soft">
            One engine, two categories: compare textbook formats and dorm
            essentials across vendors, and get a plain-language read on
            whether to buy now or wait.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {stats.map((s) => (
              <span
                key={s}
                className="font-mono text-[11px] uppercase tracking-wide text-ink-faint"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div
          className="animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <ReceiptPreview />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/textbooks"
          className="animate-fade-up group relative overflow-hidden rounded-lg border border-line bg-paper-raised p-6 transition-colors hover:border-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
          style={{ animationDelay: "200ms" }}
        >
          <span className="font-mono text-xs text-ink-faint">01</span>
          <h2 className="mt-3 font-display text-xl text-ink">Textbooks</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Search by ISBN or title. Compare new, used, rental, and ebook
            prices in one ledger.
          </p>
          <span className="mt-5 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-emerald opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Compare now
            <span className="transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </span>
        </Link>

        <Link
          href="/dorm"
          className="animate-fade-up group relative overflow-hidden rounded-lg border border-line bg-paper-raised p-6 transition-colors hover:border-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
          style={{ animationDelay: "280ms" }}
        >
          <span className="font-mono text-xs text-ink-faint">02</span>
          <h2 className="mt-3 font-display text-xl text-ink">
            Dorm essentials
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Browse common move-in items, compare prices across retailers, and
            split shared-item costs with a roommate.
          </p>
          <span className="mt-5 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-emerald opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Browse items
            <span className="transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}

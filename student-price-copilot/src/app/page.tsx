import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">
          Stop overpaying on the same purchases every semester.
        </h1>
        <p className="mt-2 max-w-xl text-slate-600">
          One engine, two categories: compare textbook formats and dorm
          essentials across vendors, and see whether to buy now or wait.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/textbooks"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-brand-700">Textbooks</h2>
          <p className="mt-1 text-sm text-slate-600">
            Search by ISBN or title. Compare new, used, rental, and ebook
            prices in one table.
          </p>
        </Link>

        <Link
          href="/dorm"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-brand-700">
            Dorm essentials
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Browse common move-in items, compare prices across retailers,
            and split shared-item costs with a roommate.
          </p>
        </Link>
      </div>
    </div>
  );
}

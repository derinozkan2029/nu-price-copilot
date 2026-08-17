"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SearchBar } from "@/components/SearchBar";
import { Modal } from "@/components/Modal";
import { PriceTable } from "@/components/PriceTable";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { PriceHistoryChart, type HistoryPoint } from "@/components/PriceHistoryChart";
import type { BookMetadata } from "@/lib/openLibrary";
import type { VendorPrice } from "@/lib/bookscouter";
import type { RecommendationSignal } from "@/types";
import { runWithConcurrencyLimit } from "@/lib/concurrency";

interface Result {
  metadata: BookMetadata;
  prices: VendorPrice[];
  pricesLive: boolean;
}

interface Recommendation {
  signal: RecommendationSignal;
  rationale: string;
}

interface PopularBook {
  label: string;
  courseTag: string;
  isbn: string;
  // Hardcoded for most entries (verified against Open Library once, see
  // commit history) so the grid doesn't have to call Open Library's free,
  // unauthenticated, rate-limited API ~40 times on every page load — that
  // burst is what was tripping its rate limiting in production. Only price
  // (genuinely time-varying) is fetched live, via /api/textbook-price.
  // Entries without these fall back to the full /api/search-textbook flow.
  authors?: string[];
  coverUrl?: string;
}

// Real gateway-course titles across departments, not just CS, so the grid
// reads as "built for NU students broadly" rather than one major.
const popularBooks: PopularBook[] = [
  { label: "Clean Code", courseTag: "COMP_SCI 308", isbn: "9780132350884" },
  { label: "Computer Systems: A Programmer's Perspective", courseTag: "COMP_SCI 213", isbn: "9780134092669" },
  { label: "Introduction to Algorithms", courseTag: "COMP_SCI 336", isbn: "9780262046305" },
  { label: "Campbell Biology", courseTag: "BIOL_SCI 217", isbn: "9780134093413" },
  { label: "Principles of Economics", courseTag: "ECON 201", isbn: "9781305585126" },
  { label: "Calculus", courseTag: "MATH 220", isbn: "9781285741550" },
  { label: "Organic Chemistry", courseTag: "CHEM 210-1", isbn: "9781118452288" },
  { label: "Psychology", courseTag: "PSYCH 110", isbn: "9781464140815" },
  {
    label: "Design Patterns", courseTag: "COMP_SCI 397", isbn: "9780201633610",
    authors: ["Erich Gamma", "Richard Helm", "Ralph Johnson", "John Vlissides"],
    coverUrl: "https://covers.openlibrary.org/b/id/10827044-L.jpg",
  },
  {
    label: "Discrete Mathematics and Its Applications", courseTag: "COMP_SCI 212", isbn: "9781259676512",
    authors: ["Kenneth H. Rosen"],
    coverUrl: "https://covers.openlibrary.org/b/id/10375823-L.jpg",
  },
  {
    label: "Operating System Concepts", courseTag: "COMP_SCI 343", isbn: "9781118063330",
    authors: ["Abraham Silberschatz"],
    coverUrl: "https://covers.openlibrary.org/b/id/7298708-L.jpg",
  },
  {
    label: "The C Programming Language", courseTag: "COMP_SCI 211", isbn: "9780131103627",
    authors: ["Brian W. Kernighan", "Dennis M. Ritchie"],
    coverUrl: "https://covers.openlibrary.org/b/id/5732572-L.jpg",
  },
  {
    label: "Structure and Interpretation of Computer Programs", courseTag: "COMP_SCI 111", isbn: "9780262510875",
    authors: ["Harold Abelson", "Gerald Jay Sussman", "Julie Sussman"],
    coverUrl: "https://covers.openlibrary.org/b/id/9325174-L.jpg",
  },
  {
    label: "Linear Algebra and Its Applications", courseTag: "MATH 240", isbn: "9780321982384",
    authors: ["David C. Lay", "Steven R. Lay", "Judi J. McDonald"],
    coverUrl: "https://covers.openlibrary.org/b/id/15243302-L.jpg",
  },
  {
    label: "University Physics", courseTag: "PHYSICS 135-2", isbn: "9780321973610",
    authors: ["Hugh D. Young", "Roger A. Freedman"],
    coverUrl: "https://covers.openlibrary.org/b/id/9388009-L.jpg",
  },
  {
    label: "College Physics", courseTag: "PHYSICS 130-1", isbn: "9781305952300",
    authors: ["Raymond A. Serway", "Jerry S. Faughn", "Chris Vuille"],
    coverUrl: "https://covers.openlibrary.org/b/id/15225119-L.jpg",
  },
  {
    label: "Chemistry: The Central Science", courseTag: "CHEM 101-1", isbn: "9780134414232",
    authors: ["Theodore L. Brown", "H. Eugene LeMay", "Bruce E. Bursten"],
    coverUrl: "https://covers.openlibrary.org/b/id/15226098-L.jpg",
  },
  {
    label: "Molecular Biology of the Cell", courseTag: "BIOL_SCI 350", isbn: "9780815344322",
    authors: ["Bruce Alberts", "Alexander Johnson", "Julian Lewis"],
    coverUrl: "https://covers.openlibrary.org/b/id/8106927-L.jpg",
  },
  {
    label: "Microeconomics", courseTag: "ECON 202", isbn: "9780134184241",
    authors: ["Robert S. Pindyck", "Daniel L. Rubinfeld"],
    coverUrl: "https://covers.openlibrary.org/b/id/10163825-L.jpg",
  },
  {
    label: "The Elements of Style", courseTag: "WCAS 101", isbn: "9780205309023",
    authors: ["William Strunk Jr.", "E. B. White"],
    coverUrl: "https://covers.openlibrary.org/b/id/10330495-L.jpg",
  },
  {
    label: "Thinking, Fast and Slow", courseTag: "PSYCH 226", isbn: "9780374533557",
    authors: ["Daniel Kahneman"],
    coverUrl: "https://covers.openlibrary.org/b/id/7889800-L.jpg",
  },
  {
    label: "Sapiens", courseTag: "ANTHRO 100", isbn: "9780062316097",
    authors: ["Yuval Noah Harari"],
    coverUrl: "https://covers.openlibrary.org/b/id/14369194-L.jpg",
  },
  {
    label: "Freakonomics", courseTag: "ECON 281", isbn: "9780060731335",
    authors: ["Steven D. Levitt", "Stephen J. Dubner"],
    coverUrl: "https://covers.openlibrary.org/b/id/7352393-L.jpg",
  },
  {
    label: "The Selfish Gene", courseTag: "BIOL_SCI 220", isbn: "9780198788607",
    authors: ["Richard Dawkins"],
    coverUrl: "https://covers.openlibrary.org/b/id/15179535-L.jpg",
  },
  {
    label: "A People's History of the United States", courseTag: "HISTORY 201", isbn: "9780062397348",
    authors: ["Howard Zinn"],
    coverUrl: "https://covers.openlibrary.org/b/id/10115742-L.jpg",
  },
  {
    label: "Guns, Germs, and Steel", courseTag: "ANTHRO 214", isbn: "9780393317558",
    authors: ["Jared Diamond"],
    coverUrl: "https://covers.openlibrary.org/b/id/12863097-L.jpg",
  },
  {
    label: "The Art of Computer Programming, Vol. 2", courseTag: "COMP_SCI 396", isbn: "9780201896831",
    authors: ["Donald Knuth"],
    coverUrl: "https://covers.openlibrary.org/b/id/136600-L.jpg",
  },
  {
    label: "Computer Networking: A Top-Down Approach", courseTag: "COMP_SCI 340", isbn: "9780133594140",
    authors: ["James F. Kurose", "Keith Ross"],
    coverUrl: "https://covers.openlibrary.org/b/id/8509058-L.jpg",
  },
  {
    label: "Database System Concepts", courseTag: "COMP_SCI 339", isbn: "9780078022159",
    authors: ["Abraham Silberschatz"],
    coverUrl: "https://covers.openlibrary.org/b/id/10385525-L.jpg",
  },
  {
    label: "Pattern Recognition and Machine Learning", courseTag: "COMP_SCI 349", isbn: "9780387310732",
    authors: ["Christopher M. Bishop"],
    coverUrl: "https://covers.openlibrary.org/b/id/245089-L.jpg",
  },
  {
    label: "Deep Learning", courseTag: "COMP_SCI 449", isbn: "9780262035613",
    authors: ["Ian Goodfellow", "Yoshua Bengio", "Aaron Courville"],
    coverUrl: "https://covers.openlibrary.org/b/id/8183675-L.jpg",
  },
  {
    label: "Multivariable Calculus", courseTag: "MATH 230", isbn: "9781305266643",
    authors: ["James Stewart"],
    coverUrl: "https://covers.openlibrary.org/b/id/8964260-L.jpg",
  },
  {
    label: "Physical Chemistry", courseTag: "CHEM 342", isbn: "9780198769866",
    authors: ["Peter Atkins", "Julio de Paula", "James Keeler"],
    coverUrl: "https://covers.openlibrary.org/b/id/8258832-L.jpg",
  },
  {
    label: "Lehninger Principles of Biochemistry", courseTag: "BIOL_SCI 331", isbn: "9781464126116",
    authors: ["David L. Nelson", "Michael M. Cox"],
    coverUrl: "https://covers.openlibrary.org/b/id/7910076-L.jpg",
  },
  {
    label: "Fundamentals of Corporate Finance", courseTag: "ECON 310", isbn: "9781259918957",
    authors: ["Stephen Ross", "Randolph Westerfield", "Bradford Jordan"],
    coverUrl: "https://covers.openlibrary.org/b/id/10409657-L.jpg",
  },
  {
    label: "Statistics", courseTag: "STAT 202", isbn: "9780393929720",
    authors: ["David Freedman", "Robert Pisani", "Roger Purves"],
    coverUrl: "https://covers.openlibrary.org/b/id/1196004-L.jpg",
  },
  {
    label: "Naked Statistics", courseTag: "STAT 101", isbn: "9780393347777",
    authors: ["Charles J. Wheelan"],
    coverUrl: "https://covers.openlibrary.org/b/id/8778981-L.jpg",
  },
  {
    label: "A Brief History of Time", courseTag: "PHYSICS 135-1", isbn: "9780553380163",
    authors: ["Stephen Hawking"],
    coverUrl: "https://covers.openlibrary.org/b/id/14589690-L.jpg",
  },
  {
    label: "Cosmos", courseTag: "ASTRO 100", isbn: "9780345539434",
    authors: ["Carl Sagan"],
    coverUrl: "https://covers.openlibrary.org/b/id/8290911-L.jpg",
  },
  {
    label: "Man's Search for Meaning", courseTag: "PSYCH 215", isbn: "9780807014295",
    authors: ["Viktor E. Frankl"],
    coverUrl: "https://covers.openlibrary.org/b/id/8513458-L.jpg",
  },
  {
    label: "Signals and Systems", courseTag: "ELEC_ENG 222", isbn: "9780138147570",
    authors: ["Alan V. Oppenheim", "Alan S. Willsky"],
    coverUrl: "https://covers.openlibrary.org/b/id/92117-L.jpg",
  },
  {
    label: "Computer Organization and Design", courseTag: "COMP_SCI 213", isbn: "9780128122754",
    authors: ["David A. Patterson", "John L. Hennessy"],
    coverUrl: "https://covers.openlibrary.org/b/id/10151148-L.jpg",
  },
];

function courseMonogram(courseTag: string) {
  return courseTag.split(" ")[0].slice(0, 2).toUpperCase();
}

// Deterministic illustrative trend ending at the real lowest price found —
// there's no historical data source yet (see seed script), so this exists
// to demo the chart component with a clearly-labeled synthetic series.
function illustrativeHistory(seed: string, endPrice: number): HistoryPoint[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;

  const points: HistoryPoint[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const wobble = ((h >> (i % 20)) % 11) - 5; // -5..5
    const drift = i * 0.9; // gentle downward drift toward today's price
    const price = i === 0 ? endPrice : Math.max(5, endPrice + drift + wobble);
    points.push({ date: date.toISOString(), price: Math.round(price * 100) / 100 });
  }
  return points;
}

export default function TextbooksPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The popular-books grid stays visible at all times now; this controls
  // whether the search outcome (loading/error/result) shows as a modal on
  // top of it, decoupled from the fetch state itself so closing early
  // doesn't get reopened by an in-flight request resolving.
  const [dismissed, setDismissed] = useState(true);

  // "loading" while in flight, Result once resolved, null on failure.
  // Fetched for every card in the popular-books grid on mount so covers
  // and prices are already there by the time the user looks at the page.
  const [popularData, setPopularData] = useState<
    Record<string, Result | "loading" | null>
  >({});

  // Open Library sometimes points at a cover id with no actual image (a
  // near-empty "not found" placeholder), which makes next/image's optimizer
  // 500 rather than just 404. Track those and fall back to the monogram.
  const [brokenCovers, setBrokenCovers] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPopularData((prev) => {
      const next = { ...prev };
      for (const book of popularBooks) next[book.isbn] = "loading";
      return next;
    });

    runWithConcurrencyLimit(popularBooks, 5, async (book) => {
      try {
        if (book.authors && book.coverUrl) {
          // Metadata is hardcoded, so only fetch the (genuinely live) price.
          const res = await fetch("/api/textbook-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isbn: book.isbn, title: book.label }),
          });
          const data = await res.json();
          const result: Result | null = res.ok
            ? {
                metadata: {
                  isbn: book.isbn,
                  title: book.label,
                  authors: book.authors,
                  imageUrl: book.coverUrl,
                },
                prices: data.prices,
                pricesLive: data.pricesLive,
              }
            : null;
          setPopularData((prev) => ({ ...prev, [book.isbn]: result }));
          return;
        }

        const res = await fetch("/api/search-textbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isbn: book.isbn }),
        });
        const data = await res.json();
        setPopularData((prev) => ({ ...prev, [book.isbn]: res.ok ? data : null }));
      } catch (err) {
        console.error(err);
        setPopularData((prev) => ({ ...prev, [book.isbn]: null }));
      }
    });
  }, []);

  async function fetchRecommendation(itemTitle: string, prices: VendorPrice[]) {
    try {
      const recRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemTitle, prices }),
      });
      const recData = await recRes.json();
      if (recRes.ok) setRecommendation(recData);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSearch(isbn: string) {
    setDismissed(false);
    setLoading(true);
    setError(null);
    setResult(null);
    setRecommendation(null);

    try {
      const res = await fetch("/api/search-textbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResult(data);
      await fetchRecommendation(data.metadata.title, data.prices);
    } catch (err) {
      console.error(err);
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function selectPopular(book: PopularBook) {
    const data = popularData[book.isbn];
    if (data && data !== "loading") {
      setDismissed(false);
      setError(null);
      setResult(data);
      setRecommendation(null);
      fetchRecommendation(data.metadata.title, data.prices);
    } else {
      handleSearch(book.isbn);
    }
  }

  function closeModal() {
    setDismissed(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-purple">
          01 &middot; Textbooks
        </p>
        <h1 className="mt-2 font-display text-2xl text-ink">
          Compare textbook prices
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Search by ISBN (13-digit, no dashes needed) to see new, used,
          rental, and ebook prices side by side before you buy at Norris.
        </p>
      </div>

      <SearchBar onSearch={handleSearch} disabled={loading} />

      <div className="animate-fade-up space-y-3" style={{ animationDelay: "80ms" }}>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              Popular at Northwestern
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Common gateway-course titles across departments. Tap one to
              compare, or search any ISBN above.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {popularBooks.map((book, index) => {
              const data = popularData[book.isbn];
              const isLoading = data === "loading" || data === undefined;
              const loaded = data && data !== "loading" ? data : null;
              const cheapest = loaded?.prices.length
                ? Math.min(...loaded.prices.map((p) => p.price))
                : null;
              const coverOk = loaded?.metadata.imageUrl && !brokenCovers.has(book.isbn);

              return (
                <button
                  key={book.isbn}
                  onClick={() => selectPopular(book)}
                  className="animate-fade-up group flex flex-col overflow-hidden rounded-sm border border-line bg-paper-raised text-left transition-colors hover:border-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                  style={{ animationDelay: `${Math.min(index, 8) * 30 + 120}ms` }}
                >
                  <div className="relative aspect-[2/3] w-full border-b border-line bg-paper">
                    {coverOk ? (
                      <>
                        <Image
                          src={loaded!.metadata.imageUrl!}
                          alt={book.label}
                          fill
                          sizes="(min-width: 640px) 25vw, 50vw"
                          className="object-cover"
                          onError={() =>
                            setBrokenCovers((prev) => new Set(prev).add(book.isbn))
                          }
                        />
                        {loaded!.pricesLive && (
                          <span className="absolute left-2 top-2 rounded-full bg-purple px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-paper">
                            Live
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                        <span className="font-display text-2xl text-ink-faint">
                          {courseMonogram(book.courseTag)}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wide text-ink-faint">
                          {isLoading ? "Loading…" : "No cover"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">
                      {book.label}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      {book.courseTag}
                    </p>
                    {cheapest !== null && (
                      <p className="mt-auto font-mono text-sm font-semibold tabular-nums text-purple-deep">
                        from ${cheapest.toFixed(2)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      {!dismissed && (loading || error || result) && (
        <Modal onClose={closeModal} labelledBy="textbook-modal-title">
          <div className="max-h-[85vh] space-y-4 overflow-y-auto p-4">
            {loading && (
              <div className="animate-fade-up space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-8 animate-pulse rounded bg-line-soft"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            )}
            {error && (
              <div className="space-y-3">
                <p className="rounded-sm border border-amber/40 bg-amber-soft px-3 py-2 font-mono text-xs text-amber-deep">
                  {error}
                </p>
                <button
                  onClick={closeModal}
                  className="rounded-sm border border-line px-2 py-1 font-mono text-xs text-ink-soft transition-colors hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                >
                  Close
                </button>
              </div>
            )}
            {result && (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-dashed border-line pb-4">
                  <div className="flex items-start gap-4">
                    {result.metadata.imageUrl && !brokenCovers.has(result.metadata.isbn) && (
                      <Image
                        src={result.metadata.imageUrl}
                        alt={result.metadata.title}
                        width={96}
                        height={144}
                        className="h-24 w-auto rounded-sm border border-line"
                        onError={() =>
                          setBrokenCovers((prev) => new Set(prev).add(result.metadata.isbn))
                        }
                      />
                    )}
                    <div>
                      <h2 id="textbook-modal-title" className="font-display text-lg text-ink">
                        {result.metadata.title}
                      </h2>
                      <p className="text-sm text-ink-soft">
                        {result.metadata.authors.join(", ")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    aria-label="Close comparison"
                    className="shrink-0 rounded-sm border border-line px-2 py-1 font-mono text-xs text-ink-soft transition-colors hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                  >
                    Close
                  </button>
                </div>

                {recommendation && (
                  <RecommendationBadge
                    signal={recommendation.signal}
                    rationale={recommendation.rationale}
                  />
                )}

                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                    Vendor prices
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
                      result.pricesLive
                        ? "bg-purple text-paper"
                        : "border border-line text-ink-faint"
                    }`}
                  >
                    {result.pricesLive ? "Live · Google Shopping" : "Demo data"}
                  </span>
                </div>
                <PriceTable prices={result.prices} />

                {result.prices.length > 0 && (
                  <PriceHistoryChart
                    points={illustrativeHistory(
                      result.metadata.isbn,
                      Math.min(...result.prices.map((p) => p.price))
                    )}
                    caption="Illustrative 14-day trend (demo data). Real history accrues once the seed script has run for a while."
                  />
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

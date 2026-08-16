"use client";

import { useState } from "react";
import Image from "next/image";
import { SearchBar } from "@/components/SearchBar";
import { PriceTable } from "@/components/PriceTable";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { PriceHistoryChart, type HistoryPoint } from "@/components/PriceHistoryChart";
import type { BookMetadata } from "@/lib/googleBooks";
import type { VendorPrice } from "@/lib/bookscouter";
import type { RecommendationSignal } from "@/types";

interface Result {
  metadata: BookMetadata;
  prices: VendorPrice[];
}

interface Recommendation {
  signal: RecommendationSignal;
  rationale: string;
}

const sampleIsbns = [
  { label: "Clean Code", isbn: "9780132350884" },
  { label: "CS:APP", isbn: "9780134092669" },
  { label: "Intro to Algorithms", isbn: "9780262046305" },
];

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

  async function handleSearch(isbn: string) {
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

      const recRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemTitle: data.metadata.title, prices: data.prices }),
      });
      const recData = await recRes.json();
      if (recRes.ok) setRecommendation(recData);
    } catch (err) {
      console.error(err);
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
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

      {!result && !loading && !error && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            Try:
          </span>
          {sampleIsbns.map((s) => (
            <button
              key={s.isbn}
              onClick={() => handleSearch(s.isbn)}
              className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink-soft transition-colors hover:border-purple hover:text-purple-deep"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="animate-fade-up space-y-2 overflow-hidden rounded-sm border border-line bg-paper-raised p-4">
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
        <p className="rounded-sm border border-amber/40 bg-amber-soft px-3 py-2 font-mono text-xs text-amber-deep">
          {error}
        </p>
      )}

      {result && (
        <div className="animate-fade-up space-y-4">
          <div className="flex items-start gap-4 border-b border-dashed border-line pb-4">
            {result.metadata.imageUrl && (
              <Image
                src={result.metadata.imageUrl}
                alt={result.metadata.title}
                width={96}
                height={144}
                className="h-24 w-auto rounded-sm border border-line"
              />
            )}
            <div>
              <h2 className="font-display text-lg text-ink">
                {result.metadata.title}
              </h2>
              <p className="text-sm text-ink-soft">
                {result.metadata.authors.join(", ")}
              </p>
            </div>
          </div>

          {recommendation && (
            <RecommendationBadge
              signal={recommendation.signal}
              rationale={recommendation.rationale}
            />
          )}

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
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { PriceTable } from "@/components/PriceTable";
import { RecommendationBadge } from "@/components/RecommendationBadge";
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
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Compare textbook prices
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Search by ISBN (13-digit, no dashes needed) to see new, used,
          rental, and ebook prices side by side.
        </p>
      </div>

      <SearchBar onSearch={handleSearch} />

      {loading && <p className="text-sm text-slate-500">Searching…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            {result.metadata.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.metadata.imageUrl}
                alt={result.metadata.title}
                className="h-24 w-auto rounded shadow-sm"
              />
            )}
            <div>
              <h2 className="font-semibold text-slate-900">
                {result.metadata.title}
              </h2>
              <p className="text-sm text-slate-600">
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
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import dormItems from "../../../data/dorm-items.json";
import { PriceTable } from "@/components/PriceTable";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { CostSplitCalculator } from "@/components/CostSplitCalculator";
import type { DormItemSeed, RecommendationSignal } from "@/types";
import type { VendorPrice } from "@/lib/bookscouter";
import { runWithConcurrencyLimit } from "@/lib/concurrency";

interface Recommendation {
  signal: RecommendationSignal;
  rationale: string;
}

type CuratedPrice = DormItemSeed["prices"][number];

interface LiveResult {
  source: "serpapi" | "bestbuy" | null;
  prices: VendorPrice[] | null;
  imageUrl: string | null;
}

const items = dormItems as DormItemSeed[];

// Real multi-vendor prices (SerpApi) fully replace the curated array;
// a real single-vendor result (Best Buy) only swaps that one row; nothing
// live falls back to the curated array either way.
function effectivePrices(
  item: DormItemSeed,
  live: LiveResult | null | undefined
): (CuratedPrice | VendorPrice)[] {
  if (live?.source === "serpapi" && live.prices) return live.prices;
  if (live?.source === "bestbuy" && live.prices) {
    const bestBuyPrice = live.prices[0];
    return item.prices.map((p) =>
      p.vendor === "Best Buy" ? { ...p, price: bestBuyPrice.price, url: bestBuyPrice.url ?? p.url } : p
    );
  }
  return item.prices;
}

function effectiveImage(
  item: DormItemSeed,
  live: LiveResult | null | undefined
): { url: string | null; isLive: boolean; source: LiveResult["source"] } {
  if (live?.imageUrl) return { url: live.imageUrl, isLive: true, source: live.source };
  if (item.imageUrl) return { url: item.imageUrl, isLive: false, source: null };
  return { url: null, isLive: false, source: null };
}

function categoryMonogram(category: string) {
  return category.slice(0, 2).toUpperCase();
}

function resolvedLive(state: LiveResult | null | "loading" | undefined): LiveResult | null {
  return state === "loading" || state === undefined ? null : state;
}

export default function DormPage() {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    []
  );
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<
    Record<string, Recommendation>
  >({});
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  // "loading" while in flight, LiveResult (possibly source: null) once
  // resolved. Fetched for every item that names a shoppingQuery or
  // bestBuyQuery — the route tries SerpApi first, Best Buy second.
  const [liveData, setLiveData] = useState<
    Record<string, LiveResult | "loading">
  >({});

  useEffect(() => {
    const withLiveQuery = items.filter((i) => i.shoppingQuery || i.bestBuyQuery);
    setLiveData((prev) => {
      const next = { ...prev };
      for (const item of withLiveQuery) next[item.title] = "loading";
      return next;
    });

    runWithConcurrencyLimit(withLiveQuery, 5, async (item) => {
      try {
        const res = await fetch("/api/dorm-item-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shoppingQuery: item.shoppingQuery,
            bestBuyQuery: item.bestBuyQuery,
          }),
        });
        const data: LiveResult = await res.json();
        setLiveData((prev) => ({ ...prev, [item.title]: data }));
      } catch (err) {
        console.error(err);
        setLiveData((prev) => ({
          ...prev,
          [item.title]: { source: null, prices: null, imageUrl: null },
        }));
      }
    });
  }, []);

  const filtered =
    category === "All" ? items : items.filter((i) => i.category === category);

  async function selectItem(item: DormItemSeed) {
    if (selected === item.title) {
      setSelected(null);
      return;
    }
    setSelected(item.title);

    if (!recommendations[item.title]) {
      setLoadingItem(item.title);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemTitle: item.title,
            prices: effectivePrices(item, resolvedLive(liveData[item.title])).map(
              (p) => ({ ...p, format: null })
            ),
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setRecommendations((prev) => ({ ...prev, [item.title]: data }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingItem(null);
      }
    }
  }

  const selectedItem = items.find((i) => i.title === selected) ?? null;
  const selectedLive = selectedItem ? resolvedLive(liveData[selectedItem.title]) : null;
  const selectedPrices = selectedItem ? effectivePrices(selectedItem, selectedLive) : [];

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-purple">
          02 &middot; Dorm essentials
        </p>
        <h1 className="mt-2 font-display text-2xl text-ink">
          Dorm essentials
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Everything you need to move into Allison, Bobb-McCulloch, Elder,
          Sargent, Shepard, or any NU residence hall. Prices and photos pull
          live from Google Shopping (and Best Buy for appliances) when
          available. Anything not found live stays a curated MVP dataset,
          clearly labeled either way.
        </p>
      </div>

      <div
        className="animate-fade-up flex flex-wrap gap-2"
        style={{ animationDelay: "80ms" }}
        role="group"
        aria-label="Filter by category"
      >
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple ${
              category === c
                ? "bg-ink text-paper"
                : "border border-line bg-paper-raised text-ink-soft hover:border-purple hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item, index) => {
          const liveState = liveData[item.title];
          const live = resolvedLive(liveState);
          const prices = effectivePrices(item, live);
          const cheapest = Math.min(...prices.map((p) => p.price));
          const isSelected = selected === item.title;
          const image = effectiveImage(item, live);
          const isChecking = liveState === "loading";

          return (
            <button
              key={item.title}
              onClick={() => selectItem(item)}
              aria-pressed={isSelected}
              className={`animate-fade-up group flex flex-col overflow-hidden rounded-sm border bg-paper-raised text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple ${
                isSelected ? "border-purple" : "border-line hover:border-purple/50"
              }`}
              style={{ animationDelay: `${Math.min(index, 8) * 30 + 120}ms` }}
            >
              <div className="relative aspect-[4/3] w-full border-b border-line bg-paper">
                {image.url ? (
                  <>
                    <Image
                      src={image.url}
                      alt={item.title}
                      fill
                      sizes="(min-width: 640px) 33vw, 50vw"
                      className={image.isLive ? "object-contain p-3" : "object-cover"}
                    />
                    {image.isLive && (
                      <span className="absolute left-2 top-2 rounded-full bg-purple px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-paper">
                        {image.source === "serpapi" ? "Live · Google Shopping" : "Live · Best Buy"}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                    <span className="font-display text-3xl text-ink-faint">
                      {categoryMonogram(item.category)}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wide text-ink-faint">
                      {isChecking ? "Checking live price…" : "Demo data"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="text-sm font-medium leading-snug text-ink">
                  {item.title}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {item.category}
                </p>
                <p className="mt-auto font-mono text-sm font-semibold tabular-nums text-purple-deep">
                  from ${cheapest.toFixed(2)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedItem && (
        <div className="animate-fade-up space-y-3 rounded-sm border border-line bg-paper-raised p-4">
          <div className="flex items-center justify-between border-b border-dashed border-line pb-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                Comparing
              </p>
              <h2 className="font-display text-lg text-ink">
                {selectedItem.title}
              </h2>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Close comparison"
              className="rounded-sm border border-line px-2 py-1 font-mono text-xs text-ink-soft transition-colors hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
            >
              Close
            </button>
          </div>

          {loadingItem === selectedItem.title && (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded bg-line-soft"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          )}
          {recommendations[selectedItem.title] && (
            <RecommendationBadge
              signal={recommendations[selectedItem.title].signal}
              rationale={recommendations[selectedItem.title].rationale}
            />
          )}
          <PriceTable
            prices={selectedPrices.map((p) => ({ ...p, format: null }))}
          />
          {!selectedLive && selectedItem.imageCredit && (
            <p className="font-mono text-[10px] text-ink-faint">
              {selectedItem.imageCredit}
            </p>
          )}
          {selectedItem.shareable && (
            <CostSplitCalculator
              price={Math.min(
                ...selectedPrices.map((p) => p.price)
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

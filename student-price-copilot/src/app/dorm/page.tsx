"use client";

import { useMemo, useState } from "react";
import dormItems from "../../../data/dorm-items.json";
import { PriceTable } from "@/components/PriceTable";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { CostSplitCalculator } from "@/components/CostSplitCalculator";
import type { DormItemSeed, RecommendationSignal } from "@/types";

interface Recommendation {
  signal: RecommendationSignal;
  rationale: string;
}

const items = dormItems as DormItemSeed[];

export default function DormPage() {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    []
  );
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<
    Record<string, Recommendation>
  >({});
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const filtered =
    category === "All" ? items : items.filter((i) => i.category === category);

  async function toggleExpand(item: DormItemSeed) {
    if (expanded === item.title) {
      setExpanded(null);
      return;
    }
    setExpanded(item.title);

    if (!recommendations[item.title]) {
      setLoadingItem(item.title);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemTitle: item.title,
            prices: item.prices.map((p) => ({ ...p, format: null })),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Dorm essentials
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Common move-in items with prices across retailers. Prices below are
          a curated MVP dataset, refreshed manually — see the build plan for
          the v2 data-source approach.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm ${
              category === c
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-brand-500"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item) => {
          const cheapest = Math.min(...item.prices.map((p) => p.price));
          const isOpen = expanded === item.title;

          return (
            <div
              key={item.title}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <button
                onClick={() => toggleExpand(item)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-700">
                    from ${cheapest.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isOpen ? "hide" : "compare"}
                  </p>
                </div>
              </button>

              {isOpen && (
                <div className="mt-4 space-y-3">
                  {loadingItem === item.title && (
                    <p className="text-sm text-slate-500">
                      Getting a recommendation…
                    </p>
                  )}
                  {recommendations[item.title] && (
                    <RecommendationBadge
                      signal={recommendations[item.title].signal}
                      rationale={recommendations[item.title].rationale}
                    />
                  )}
                  <PriceTable
                    prices={item.prices.map((p) => ({ ...p, format: null }))}
                  />
                  {item.shareable && (
                    <CostSplitCalculator price={cheapest} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

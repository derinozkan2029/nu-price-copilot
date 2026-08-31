"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import roomThemesData from "../../../data/room-themes.json";
import type { PlacedRoomItem } from "@/components/Room3D";
import { AnimatedPrice } from "@/components/AnimatedPrice";
import type { RoomTheme, RoomZone } from "@/types";
import { runWithConcurrencyLimit } from "@/lib/concurrency";

// WebGL needs the browser: no SSR, and a fixed-aspect placeholder while the
// three.js bundle loads so the page doesn't jump.
const Room3D = dynamic(() => import("@/components/Room3D").then((m) => m.Room3D), {
  ssr: false,
  loading: () => (
    <div
      className="flex w-full items-center justify-center rounded-lg border border-line bg-paper-raised font-mono text-xs uppercase tracking-wide text-ink-faint"
      style={{ aspectRatio: "4 / 3" }}
    >
      Loading room…
    </div>
  ),
});

const themes = roomThemesData as RoomTheme[];

interface LiveItem {
  price: number | null;
  imageUrl: string | null;
}

export default function DecoratePage() {
  const [themeId, setThemeId] = useState<string | null>(null);
  const [placedTitles, setPlacedTitles] = useState<Set<string>>(new Set());
  const [liveData, setLiveData] = useState<
    Record<string, LiveItem | "loading">
  >({});
  const fetchedQueries = useRef<Set<string>>(new Set());

  const theme = themes.find((t) => t.id === themeId) ?? null;

  function selectTheme(next: RoomTheme) {
    if (next.id === themeId) return;
    setThemeId(next.id);
    setPlacedTitles(new Set());

    const toFetch = next.items.filter(
      (item) => !fetchedQueries.current.has(item.shoppingQuery)
    );
    if (toFetch.length === 0) return;

    setLiveData((prev) => {
      const nextState = { ...prev };
      for (const item of toFetch) nextState[item.shoppingQuery] = "loading";
      return nextState;
    });

    runWithConcurrencyLimit(toFetch, 4, async (item) => {
      fetchedQueries.current.add(item.shoppingQuery);
      try {
        const res = await fetch("/api/dorm-item-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shoppingQuery: item.shoppingQuery }),
        });
        const data = await res.json();
        const prices = data.prices as { price: number }[] | null;
        setLiveData((prev) => ({
          ...prev,
          [item.shoppingQuery]: {
            price: prices?.length ? Math.min(...prices.map((p) => p.price)) : null,
            imageUrl: data.imageUrl ?? null,
          },
        }));
      } catch (err) {
        console.error(err);
        setLiveData((prev) => ({
          ...prev,
          [item.shoppingQuery]: { price: null, imageUrl: null },
        }));
      }
    });
  }

  function toggleItem(title: string) {
    setPlacedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  const placedByZone: Record<RoomZone, PlacedRoomItem[]> = {
    wall: [],
    bed: [],
    desk: [],
    floor: [],
  };
  if (theme) {
    for (const item of theme.items) {
      if (!placedTitles.has(item.title)) continue;
      const live = liveData[item.shoppingQuery];
      const imageUrl = live && live !== "loading" ? live.imageUrl : null;
      placedByZone[item.zone].push({ title: item.title, imageUrl });
    }
  }

  const total = theme
    ? theme.items
        .filter((item) => placedTitles.has(item.title))
        .reduce((sum, item) => {
          const live = liveData[item.shoppingQuery];
          const price = live && live !== "loading" ? live.price : null;
          return sum + (price ?? 0);
        }, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-purple">
          03 &middot; Decorate your room
        </p>
        <h1 className="mt-2 font-display text-2xl text-ink">
          Decorate your room
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Start with an empty room, pick a theme, then click items to add
          them &mdash; they land on the wall, bed, desk, or floor and pull a
          real price and photo live from Google Shopping. Drag to look
          around the room, scroll to zoom.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <div className="animate-fade-up space-y-3" style={{ animationDelay: "80ms" }}>
          <Room3D placedByZone={placedByZone} />
          <div className="flex items-center justify-between rounded-sm border border-line bg-paper-raised px-4 py-2.5">
            <span className="font-mono text-xs uppercase tracking-wide text-ink-faint">
              {placedTitles.size} item{placedTitles.size === 1 ? "" : "s"} placed
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold tabular-nums text-purple-deep">
                <AnimatedPrice value={total} />
              </span>
              {placedTitles.size > 0 && (
                <button
                  onClick={() => setPlacedTitles(new Set())}
                  className="rounded-sm border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-soft transition-colors hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div
            className="animate-fade-up"
            style={{ animationDelay: "140ms" }}
          >
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink-faint">
              Choose a theme
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {themes.map((t) => {
                const active = t.id === themeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTheme(t)}
                    aria-pressed={active}
                    className={`flex flex-col items-start gap-1.5 rounded-sm border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple ${
                      active
                        ? "border-purple bg-purple-soft"
                        : "border-line bg-paper-raised hover:border-purple/50"
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-line"
                      style={{ backgroundColor: t.accent }}
                      aria-hidden
                    />
                    <span className="text-xs font-medium leading-tight text-ink">
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {theme && (
            <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink-faint">
                Suggested for {theme.name}
              </p>
              <div className="space-y-2">
                {theme.items.map((item) => {
                  const live = liveData[item.shoppingQuery];
                  const isPlaced = placedTitles.has(item.title);
                  const isLoading = live === "loading";
                  const resolved = live && live !== "loading" ? live : null;

                  return (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-sm border border-line bg-paper-raised p-2.5"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-line bg-paper">
                        {resolved?.imageUrl ? (
                          <Image
                            src={resolved.imageUrl}
                            alt={item.title}
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-ink-faint">
                            {isLoading ? "…" : item.title.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-snug text-ink">
                          {item.title}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                          {item.zone}
                        </p>
                      </div>
                      <div className="w-16 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-purple-deep">
                        {resolved?.price != null ? (
                          <AnimatedPrice value={resolved.price} />
                        ) : (
                          <span className="text-ink-faint">
                            {isLoading ? "…" : "—"}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleItem(item.title)}
                        aria-pressed={isPlaced}
                        className={`shrink-0 rounded-sm border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple ${
                          isPlaced
                            ? "border-purple bg-purple text-paper"
                            : "border-line text-ink-soft hover:border-purple hover:text-purple"
                        }`}
                      >
                        {isPlaced ? "Added" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

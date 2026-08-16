// Resolves vendor prices for a given textbook, trying real sources first
// and falling back to deterministic mock data so the app is always
// demoable. Priority: SerpApi (Google Shopping, real multi-vendor prices)
// -> BookScouter (real multi-vendor prices, needs a developer-tier key)
// -> mock generator.
//
// BookScouter offers a "Cached Prices API" plus tiered developer access —
// see https://bookscouter.com/blog/api-data-services/. The request shape
// below is a reasonable starting point but VERIFY it against your
// dashboard docs once you have a key — vendors sometimes change endpoint
// paths. This app's own BookScouter application was rejected, which is
// why SerpApi (see src/lib/serpapi.ts) is the primary live source.

// Relative import (not the "@/" alias) so this module resolves correctly
// both inside Next.js and when run standalone via `tsx` in the seed script.
import type { PriceFormat } from "../types";
import { lookupShoppingPrices } from "./serpapi";

export interface VendorPrice {
  vendor: string;
  price: number;
  format: PriceFormat;
  url?: string;
}

export interface PriceLookupResult {
  prices: VendorPrice[];
  isLive: boolean;
}

export async function lookupTextbookPrices(
  isbn: string,
  title?: string
): Promise<PriceLookupResult> {
  if (title) {
    const shoppingPrices = await lookupShoppingPrices(`${title} textbook`);
    if (shoppingPrices) return { prices: shoppingPrices, isLive: true };
  }

  const apiKey = process.env.BOOKSCOUTER_API_KEY;
  if (apiKey) {
    const res = await fetch(
      `https://api.bookscouter.com/v4/prices/${encodeURIComponent(isbn)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 60 * 60 }, // cache prices for an hour
      }
    );

    if (!res.ok) {
      console.error(`BookScouter API error (${res.status}) for ISBN ${isbn}`);
    } else {
      const data = await res.json();

      // NOTE: adjust this mapping once you've confirmed the real response
      // shape from your BookScouter dashboard / API docs.
      const prices: VendorPrice[] = (data.prices ?? data.vendors ?? []).map(
        (p: any) => ({
          vendor: p.vendorName ?? p.vendor ?? "unknown",
          price: Number(p.price ?? p.amount ?? 0),
          format: (p.format ?? "used") as PriceFormat,
          url: p.url,
        })
      );

      if (prices.length) return { prices, isLive: true };
    }
  }

  return { prices: mockPrices(isbn), isLive: false };
}

// Deterministic mock so the same ISBN always returns the same demo prices —
// useful for screenshots and consistent local dev without an API key.
function mockPrices(isbn: string): VendorPrice[] {
  const seed = hashString(isbn);
  const basePrice = 40 + (seed % 60); // $40-$100 "new" price

  return [
    { vendor: "Campus Bookstore", price: basePrice, format: "new" },
    {
      vendor: "Amazon",
      price: round(basePrice * 0.82),
      format: "used",
    },
    {
      vendor: "Chegg",
      price: round(basePrice * 0.35),
      format: "rental",
    },
    {
      vendor: "AbeBooks",
      price: round(basePrice * 0.55),
      format: "used",
    },
    {
      vendor: "VitalSource",
      price: round(basePrice * 0.6),
      format: "ebook",
    },
  ];
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

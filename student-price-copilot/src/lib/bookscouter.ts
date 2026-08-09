// Wrapper around BookScouter's price data for a given ISBN.
// BookScouter offers a "Cached Prices API" plus tiered developer access —
// see https://bookscouter.com/blog/api-data-services/ and sign up for an
// API key at https://bookscouter.com to get the exact endpoint + auth
// scheme for your tier before going live. The request shape below is a
// reasonable starting point but VERIFY it against your dashboard docs
// once you have a key — vendors sometimes change endpoint paths.
//
// Until BOOKSCOUTER_API_KEY is set, this falls back to a small deterministic
// mock generator so the rest of the app (UI, charts, recommendation logic)
// is fully demoable without a paid API key.

// Relative import (not the "@/" alias) so this module resolves correctly
// both inside Next.js and when run standalone via `tsx` in the seed script.
import type { PriceFormat } from "../types";

export interface VendorPrice {
  vendor: string;
  price: number;
  format: PriceFormat;
  url?: string;
}

export async function lookupTextbookPrices(
  isbn: string
): Promise<VendorPrice[]> {
  const apiKey = process.env.BOOKSCOUTER_API_KEY;

  if (!apiKey) {
    return mockPrices(isbn);
  }

  const res = await fetch(
    `https://api.bookscouter.com/v4/prices/${encodeURIComponent(isbn)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 * 60 }, // cache prices for an hour
    }
  );

  if (!res.ok) {
    console.error(`BookScouter API error (${res.status}) for ISBN ${isbn}`);
    return mockPrices(isbn);
  }

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

  return prices.length ? prices : mockPrices(isbn);
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

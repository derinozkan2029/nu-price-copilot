// Real cross-vendor price + photo lookup via SerpApi's Google Shopping engine.
// Docs: https://serpapi.com/google-shopping-api
// Free tier (250 searches/month, no approval wait) at https://serpapi.com/users/sign_up
//
// Originally built to replace BookScouter for textbook pricing (that
// developer application was rejected, and there's no other clean free API
// for cross-retailer textbook pricing). Since Google Shopping search works
// for literally any product, it doubles as the primary live source for the
// dorm catalog too — see lookupShoppingProduct() below, used by
// src/app/api/dorm-item-price/route.ts. SerpApi returns Google Shopping's
// own aggregated listings (an established commercial data API, not a
// site-specific scraper), which gives real price + merchant name + a real
// product photo across multiple retailers for a text query.

import type { PriceFormat } from "../types";
import type { VendorPrice } from "./bookscouter";

interface ShoppingResult {
  title?: string;
  source?: string;
  extracted_price?: number;
  product_link?: string;
  link?: string;
  thumbnail?: string;
}

export interface SimilarProduct {
  title: string;
  price: number;
  vendor: string;
  thumbnail: string;
  url: string;
}

async function fetchShoppingResults(
  query: string
): Promise<ShoppingResult[] | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
    // 21 days: the catalog has grown to ~76 textbooks + ~55 dorm items,
    // ~131 unique queries. At 14 days that's already ~281/month at steady
    // state, over SerpApi's 250/month free-tier cap before counting any
    // cache-miss burst from adding new items. 21 days brings steady state
    // to ~187/month, leaving real margin. Prices don't need to be fresher
    // than that for a portfolio demo.
    next: { revalidate: 60 * 60 * 24 * 21 },
  });

  if (!res.ok) {
    console.error(`SerpApi error (${res.status}) for query "${query}"`);
    return null;
  }

  const data = await res.json();
  return data.shopping_results ?? [];
}

function toVendorPrices(results: ShoppingResult[]): VendorPrice[] {
  return results
    .filter(
      (r): r is Required<Pick<ShoppingResult, "source" | "extracted_price">> &
        ShoppingResult =>
          typeof r.extracted_price === "number" &&
          // Google Shopping occasionally mixes in buyback/trade-in quotes
          // (e.g. a bookstore's "sell us your book for $0.02" listing) among
          // real offers. No genuine product is ever priced under $1, so this
          // is a cheap way to drop that noise without a vendor allowlist.
          r.extracted_price >= 1 &&
          !!r.source
    )
    .slice(0, 6)
    .map((r) => ({
      vendor: r.source!,
      price: r.extracted_price!,
      // Google Shopping doesn't reliably label new/used/rental/ebook —
      // leave it unset rather than guess wrong.
      format: null as PriceFormat,
      url: r.product_link ?? r.link,
    }));
}

// Used for textbooks: just the price comparison, no photo (the book cover
// already comes from Open Library).
export async function lookupShoppingPrices(
  query: string
): Promise<VendorPrice[] | null> {
  const results = await fetchShoppingResults(query);
  if (!results) return null;

  const prices = toVendorPrices(results);
  return prices.length ? prices : null;
}

// Used for dorm items: real multi-vendor prices plus a real product photo
// (the first result with a thumbnail), since dorm items have no separate
// metadata source the way textbooks have Open Library.
export async function lookupShoppingProduct(
  query: string
): Promise<{ prices: VendorPrice[]; imageUrl: string | null } | null> {
  const results = await fetchShoppingResults(query);
  if (!results) return null;

  const prices = toVendorPrices(results);
  if (!prices.length) return null;

  const imageUrl = results.find((r) => r.thumbnail)?.thumbnail ?? null;
  return { prices, imageUrl };
}

export interface SimilarProductsResult {
  // false only means the request itself failed (network error, SerpApi
  // rate/concurrency cap) — retryable. true + empty products means the
  // request succeeded and genuinely found nothing worth showing.
  ok: boolean;
  products: SimilarProduct[] | null;
}

function toSimilarProducts(results: ShoppingResult[]): SimilarProduct[] | null {
  const products = results
    .filter(
      (r): r is Required<Pick<ShoppingResult, "title" | "source" | "extracted_price" | "thumbnail">> &
        ShoppingResult =>
          typeof r.extracted_price === "number" &&
          r.extracted_price >= 1 &&
          !!r.source &&
          !!r.thumbnail &&
          !!r.title
    )
    .slice(0, 8)
    .map((r) => ({
      title: r.title!,
      price: r.extracted_price!,
      vendor: r.source!,
      thumbnail: r.thumbnail!,
      url: r.product_link ?? r.link ?? "#",
    }));

  return products.length ? products : null;
}

async function fetchShoppingResultsOnce(
  query: string
): Promise<{ ok: true; results: ShoppingResult[] } | { ok: false }> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return { ok: true, results: [] };

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    api_key: apiKey,
  });

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 24 * 21 },
    });
    if (!res.ok) {
      console.error(`SerpApi error (${res.status}) for related-products query "${query}"`);
      return { ok: false };
    }
    const data = await res.json();
    return { ok: true, results: data.shopping_results ?? [] };
  } catch (err) {
    console.error(`SerpApi network error for related-products query "${query}":`, err);
    return { ok: false };
  }
}

// "You might also like" results for dorm decor items — a broader,
// category-level query (e.g. "canvas wall art dorm" rather than one
// specific print) so Google Shopping returns genuinely different
// products/designs instead of the same item across vendors. Deliberately
// a separate query from lookupShoppingProduct's exact-item query, and
// deliberately category-level so many items can share one cached call.
//
// The dorm page fires up to 54 of lookupShoppingProduct's exact-item
// requests concurrently on page load (see src/lib/concurrency.ts). If a
// visitor opens an item's modal — firing this lookup — while that burst
// is still in flight, the combined request volume can trip SerpApi's
// per-key concurrency cap on the free tier. Since that's usually a
// transient collision, one retry after a short delay resolves most of
// them without the caller needing to know anything went wrong.
export async function lookupSimilarProducts(
  query: string
): Promise<SimilarProductsResult> {
  let attempt = await fetchShoppingResultsOnce(query);
  if (!attempt.ok) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    attempt = await fetchShoppingResultsOnce(query);
  }
  if (!attempt.ok) return { ok: false, products: null };

  return { ok: true, products: toSimilarProducts(attempt.results) };
}

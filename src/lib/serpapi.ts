// Real cross-vendor price lookup via SerpApi's Google Shopping engine.
// Docs: https://serpapi.com/google-shopping-api
// Free tier (250 searches/month, no approval wait) at https://serpapi.com/users/sign_up
//
// This replaces BookScouter as the live-pricing source: BookScouter's
// developer application was rejected, and there's no other clean free API
// for cross-retailer textbook pricing. SerpApi returns Google Shopping's
// own aggregated listings (an established commercial data API, not a
// site-specific scraper), which gives real price + merchant name across
// multiple retailers for a text query.

import type { PriceFormat } from "../types";
import type { VendorPrice } from "./bookscouter";

interface ShoppingResult {
  source?: string;
  extracted_price?: number;
  product_link?: string;
  link?: string;
}

export async function lookupShoppingPrices(
  query: string
): Promise<VendorPrice[] | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
    next: { revalidate: 60 * 60 }, // cache prices for an hour
  });

  if (!res.ok) {
    console.error(`SerpApi error (${res.status}) for query "${query}"`);
    return null;
  }

  const data = await res.json();
  const results: ShoppingResult[] = data.shopping_results ?? [];

  const prices: VendorPrice[] = results
    .filter(
      (r): r is Required<Pick<ShoppingResult, "source" | "extracted_price">> &
        ShoppingResult => typeof r.extracted_price === "number" && !!r.source
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

  return prices.length ? prices : null;
}

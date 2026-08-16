import { NextRequest, NextResponse } from "next/server";
import { lookupBestBuyProduct } from "@/lib/bestbuy";
import { lookupShoppingProduct } from "@/lib/serpapi";
import type { VendorPrice } from "@/lib/bookscouter";

// POST { shoppingQuery?: string, bestBuyQuery?: string }
// Live price + photo lookup for a dorm item, trying real sources in order:
// SerpApi (Google Shopping — real multi-vendor prices + photo, works for
// any item) -> Best Buy Products API (single-vendor swap, appliances only)
// -> nothing. Always returns 200 with `source: null` rather than an error
// when no keys are set or nothing matches, so the dorm page can fall back
// to curated data without a special-case error path.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const shoppingQuery =
    typeof body?.shoppingQuery === "string" ? body.shoppingQuery.trim() : null;
  const bestBuyQuery =
    typeof body?.bestBuyQuery === "string" ? body.bestBuyQuery.trim() : null;

  if (!shoppingQuery && !bestBuyQuery) {
    return NextResponse.json(
      { error: "Provide at least one of 'shoppingQuery' or 'bestBuyQuery'." },
      { status: 400 }
    );
  }

  try {
    if (shoppingQuery) {
      const shopping = await lookupShoppingProduct(shoppingQuery);
      if (shopping) {
        return NextResponse.json({
          source: "serpapi",
          prices: shopping.prices,
          imageUrl: shopping.imageUrl,
        });
      }
    }

    if (bestBuyQuery) {
      const product = await lookupBestBuyProduct(bestBuyQuery);
      if (product) {
        const prices: VendorPrice[] = [
          { vendor: product.vendor, price: product.price, format: null, url: product.productUrl ?? undefined },
        ];
        return NextResponse.json({
          source: "bestbuy",
          prices,
          imageUrl: product.imageUrl,
        });
      }
    }

    return NextResponse.json({ source: null, prices: null, imageUrl: null });
  } catch (err) {
    console.error("dorm-item-price error:", err);
    return NextResponse.json({ source: null, prices: null, imageUrl: null });
  }
}

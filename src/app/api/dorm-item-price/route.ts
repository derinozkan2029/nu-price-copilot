import { NextRequest, NextResponse } from "next/server";
import { lookupBestBuyProduct } from "@/lib/bestbuy";

// POST { query: string }
// Live price + photo lookup for the handful of dorm items Best Buy actually
// carries (see bestBuyQuery in data/dorm-items.json). Returns `{ product: null }`
// rather than an error when no API key is set or nothing matches, so the
// dorm page can fall back to curated data without a special-case error path.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : null;

  if (!query) {
    return NextResponse.json(
      { error: "Missing or invalid 'query' in request body." },
      { status: 400 }
    );
  }

  try {
    const product = await lookupBestBuyProduct(query);
    return NextResponse.json({ product });
  } catch (err) {
    console.error("dorm-item-price error:", err);
    return NextResponse.json({ product: null });
  }
}

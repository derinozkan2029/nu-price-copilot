import { NextRequest, NextResponse } from "next/server";
import { explainRecommendation } from "@/lib/recommendation";
import type { VendorPrice } from "@/lib/bookscouter";

// POST { itemTitle: string, prices: VendorPrice[] }
// Shared by both the textbook and dorm item detail pages: given a title and
// a list of vendor prices, returns a buy-now/wait signal plus a short
// plain-language rationale (LLM-backed if ANTHROPIC_API_KEY is set, else a
// templated fallback — see src/lib/recommendation.ts).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const itemTitle = typeof body?.itemTitle === "string" ? body.itemTitle : null;
  const prices = Array.isArray(body?.prices) ? (body.prices as VendorPrice[]) : null;

  if (!itemTitle || !prices || prices.length === 0) {
    return NextResponse.json(
      { error: "Request body must include 'itemTitle' and a non-empty 'prices' array." },
      { status: 400 }
    );
  }

  try {
    const result = await explainRecommendation(itemTitle, prices);
    return NextResponse.json(result);
  } catch (err) {
    console.error("recommend error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendation." },
      { status: 500 }
    );
  }
}

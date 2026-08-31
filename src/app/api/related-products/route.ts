import { NextRequest, NextResponse } from "next/server";
import { lookupSimilarProducts } from "@/lib/serpapi";

// POST { query: string }
// "You might also like" grid — a broader category-level Google Shopping
// lookup, separate from dorm-item-price's exact-item query. Always returns
// 200 so the UI can just hide the section rather than special-case an
// error, but carries `ok: false` when the lookup itself failed (vs. a
// clean response that genuinely found nothing) so the client knows not to
// treat that as a permanent "no related items" for this query.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : null;

  if (!query) {
    return NextResponse.json(
      { error: "Provide 'query'." },
      { status: 400 }
    );
  }

  try {
    const { ok, products } = await lookupSimilarProducts(query);
    return NextResponse.json({ ok, products });
  } catch (err) {
    console.error("related-products error:", err);
    return NextResponse.json({ ok: false, products: null });
  }
}

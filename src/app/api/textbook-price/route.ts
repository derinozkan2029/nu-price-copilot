import { NextRequest, NextResponse } from "next/server";
import { lookupTextbookPrices } from "@/lib/bookscouter";

// POST { isbn: string, title: string } -> { prices, pricesLive }
// Price-only sibling of /api/search-textbook, for books whose metadata
// (title/authors/cover) is already known client-side — the "Popular at
// Northwestern" grid is a fixed curated list, so there's no reason to
// re-fetch that from Open Library on every page load. Skipping it here
// cuts a ~40-item grid from ~40 Open Library calls down to 0, which is
// what was tripping Open Library's rate limiting under a concurrent
// burst (see commit history).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const isbn = typeof body?.isbn === "string" ? body.isbn.replace(/[-\s]/g, "") : null;
  const title = typeof body?.title === "string" ? body.title : null;

  if (!isbn || !title) {
    return NextResponse.json(
      { error: "Both 'isbn' and 'title' are required." },
      { status: 400 }
    );
  }

  try {
    const { prices, isLive } = await lookupTextbookPrices(isbn, title);
    return NextResponse.json({ prices, pricesLive: isLive });
  } catch (err) {
    console.error("textbook-price error:", err);
    return NextResponse.json(
      { error: "Failed to look up textbook prices." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { lookupBookByIsbn } from "@/lib/openLibrary";
import { lookupTextbookPrices } from "@/lib/bookscouter";

// POST { isbn: string }
// Looks up book metadata, then vendor prices (which need the book's title
// to search SerpApi effectively, so this can't run in parallel with the
// metadata lookup the way it used to). Does not persist to Supabase yet —
// that happens via scripts/seed-textbooks.ts for a curated list, keeping
// this endpoint fast and free of write-permission concerns for the MVP demo.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const isbn = typeof body?.isbn === "string" ? body.isbn.replace(/[-\s]/g, "") : null;

  if (!isbn) {
    return NextResponse.json(
      { error: "Missing or invalid 'isbn' in request body." },
      { status: 400 }
    );
  }

  try {
    const metadata = await lookupBookByIsbn(isbn);

    if (!metadata) {
      return NextResponse.json(
        { error: `No book found for ISBN ${isbn}.` },
        { status: 404 }
      );
    }

    const { prices, isLive } = await lookupTextbookPrices(isbn, metadata.title);

    return NextResponse.json({ metadata, prices, pricesLive: isLive });
  } catch (err) {
    console.error("search-textbook error:", err);
    return NextResponse.json(
      { error: "Failed to look up textbook prices." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { lookupBookByIsbn } from "@/lib/googleBooks";
import { lookupTextbookPrices } from "@/lib/bookscouter";

// POST { isbn: string }
// Looks up book metadata + vendor prices for a given ISBN. Does not persist
// to Supabase yet — that happens via scripts/seed-textbooks.ts for a
// curated list, keeping this endpoint fast and free of write-permission
// concerns for the MVP demo.
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
    const [metadata, prices] = await Promise.all([
      lookupBookByIsbn(isbn),
      lookupTextbookPrices(isbn),
    ]);

    if (!metadata) {
      return NextResponse.json(
        { error: `No book found for ISBN ${isbn}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ metadata, prices });
  } catch (err) {
    console.error("search-textbook error:", err);
    return NextResponse.json(
      { error: "Failed to look up textbook prices." },
      { status: 500 }
    );
  }
}

// Thin wrapper around the Google Books API for ISBN -> metadata lookups.
// Docs: https://developers.google.com/books/docs/v1/using
// Free for fair-use volume; set GOOGLE_BOOKS_API_KEY to raise rate limits.

export interface BookMetadata {
  isbn: string;
  title: string;
  authors: string[];
  imageUrl: string | null;
}

export async function lookupBookByIsbn(
  isbn: string
): Promise<BookMetadata | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const params = new URLSearchParams({ q: `isbn:${isbn}` });
  if (apiKey) params.set("key", apiKey);

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
    { next: { revalidate: 60 * 60 * 24 } } // cache metadata for a day
  );

  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status}`);
  }

  const data = await res.json();
  const first = data.items?.[0];
  if (!first) return null;

  const info = first.volumeInfo ?? {};
  return {
    isbn,
    title: info.title ?? "Unknown title",
    authors: info.authors ?? [],
    imageUrl: info.imageLinks?.thumbnail ?? null,
  };
}

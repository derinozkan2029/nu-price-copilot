// Thin wrapper around the Open Library API for ISBN -> metadata lookups.
// Docs: https://openlibrary.org/dev/docs/api/books
// Free, public, no API key or signup required, run by the Internet Archive.
// Replaced the Google Books integration after repeated unauthenticated
// rate-limiting during testing and Google Cloud project-creation being
// blocked on a Google Workspace-managed account.

export interface BookMetadata {
  isbn: string;
  title: string;
  authors: string[];
  imageUrl: string | null;
}

export async function lookupBookByIsbn(
  isbn: string
): Promise<BookMetadata | null> {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    { next: { revalidate: 60 * 60 * 24 } } // cache metadata for a day
  );

  if (!res.ok) {
    throw new Error(`Open Library API error: ${res.status}`);
  }

  const data = await res.json();
  const info = data[`ISBN:${isbn}`];
  if (!info) return null;

  return {
    isbn,
    title: info.title ?? "Unknown title",
    authors: (info.authors ?? []).map((a: { name: string }) => a.name),
    imageUrl: info.cover?.large ?? info.cover?.medium ?? null,
  };
}

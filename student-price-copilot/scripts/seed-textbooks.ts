/**
 * Seeds Supabase with a starter list of textbook ISBNs so the app has real
 * rows to demo against, not just live API calls. Run with:
 *
 *   npm run seed:textbooks
 *
 * Requires .env.local to have NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY set (see .env.example). GOOGLE_BOOKS_API_KEY
 * and BOOKSCOUTER_API_KEY are optional — without them you'll get
 * unauthenticated Google Books results and mock BookScouter prices, which
 * is fine for a demo.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getServiceClient } from "../src/lib/supabaseClient";
import { lookupBookByIsbn } from "../src/lib/googleBooks";
import { lookupTextbookPrices } from "../src/lib/bookscouter";

// Swap this out for ISBNs of your own school's common intro-course textbooks.
const STARTER_ISBNS = [
  "9780134685991", // Effective Java
  "9780262046305", // Introduction to Algorithms
  "9780134093413", // Campbell Biology
  "9781464125630", // Molecular Biology of the Cell
  "9780393600643", // Principles of Economics (equivalent editions vary)
];

async function main() {
  const supabase = getServiceClient();

  for (const isbn of STARTER_ISBNS) {
    console.log(`Seeding ${isbn}...`);

    const [metadata, prices] = await Promise.all([
      lookupBookByIsbn(isbn),
      lookupTextbookPrices(isbn),
    ]);

    if (!metadata) {
      console.warn(`  No metadata found for ${isbn}, skipping.`);
      continue;
    }

    const { data: item, error: itemError } = await supabase
      .from("items")
      .upsert(
        {
          type: "textbook",
          title: metadata.title,
          isbn,
          image_url: metadata.imageUrl,
        },
        { onConflict: "isbn" }
      )
      .select()
      .single();

    if (itemError || !item) {
      console.error(`  Failed to upsert item for ${isbn}:`, itemError);
      continue;
    }

    const priceRows = prices.map((p) => ({
      item_id: item.id,
      vendor: p.vendor,
      price: p.price,
      format: p.format,
      url: p.url ?? null,
    }));

    const { error: priceError } = await supabase.from("prices").insert(priceRows);
    if (priceError) {
      console.error(`  Failed to insert prices for ${isbn}:`, priceError);
      continue;
    }

    console.log(`  Seeded "${metadata.title}" with ${priceRows.length} prices.`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

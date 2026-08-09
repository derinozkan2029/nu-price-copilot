# Student Price Copilot

One comparison engine, two verticals: textbooks (buy/rent/used/ebook across
vendors) and dorm essentials (curated retailer price comparison + roommate
cost-splitting). Built as a portfolio project for APM internship applications
— see the "Product framing" section below for how to talk about it.

## Quick start (runs with zero API keys)

```bash
npm install
cp .env.example .env.local   # leave everything blank to start
npm run dev
```

Open http://localhost:3000. The textbooks search and dorm browser both work
out of the box: textbook prices come from a deterministic mock generator
until you add a `BOOKSCOUTER_API_KEY`, and dorm prices come from the curated
`data/dorm-items.json` file. The "buy now vs wait" explanation uses a
templated fallback until you add `ANTHROPIC_API_KEY`.

## Adding real data sources

1. **Google Books API** (textbook metadata — title, author, cover image).
   Free for fair-use volume, no key strictly required, but add
   `GOOGLE_BOOKS_API_KEY` in Google Cloud Console to raise your rate limit.
   Docs: https://developers.google.com/books/docs/v1/using

2. **BookScouter API** (cross-vendor textbook prices). Sign up at
   https://bookscouter.com for a developer-tier key, then set
   `BOOKSCOUTER_API_KEY`. The request in `src/lib/bookscouter.ts` is a
   starting point — confirm the exact endpoint path and response shape
   against your dashboard docs once you have a key, since the mapping in
   that file is written from public documentation, not a live-tested
   response.

3. **Anthropic API** (plain-language recommendation explanations). Get a key
   at https://console.anthropic.com and set `ANTHROPIC_API_KEY`.

4. **Best Buy Products API** (live price + photo for two dorm items only —
   the mini fridge and microwave). Free, self-serve key at
   https://developer.bestbuy.com/, then set `BESTBUY_API_KEY`. Best Buy
   doesn't carry most of the dorm catalog (bedding, storage, decor,
   furniture), so this stays scoped to appliances rather than replacing
   `data/dorm-items.json` wholesale — see `src/lib/bestbuy.ts` for the
   lookup and `src/app/dorm/page.tsx` for how the live result merges into
   the curated vendor list. Their terms only permit temporary caching
   (response links expire after 7 days), so the fetch uses a short
   `revalidate` window rather than persisting results.

5. **Supabase** (persistence — only needed if you want the seed script to
   store real historical price data instead of relying on live API calls
   each time):
   - Create a free project at https://supabase.com
   - Run `supabase/schema.sql` in the SQL editor
   - Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
     `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   - Run `npm run seed:textbooks` to populate a starter list of ISBNs

## Project structure

```
src/app/                 Next.js App Router pages + API routes
  page.tsx                 Home (category picker)
  textbooks/page.tsx        Textbook ISBN search
  dorm/page.tsx              Dorm item browser
  api/search-textbook/       POST { isbn } -> metadata + prices
  api/recommend/             POST { itemTitle, prices } -> buy-now/wait signal
  api/dorm-item-price/       POST { query } -> live Best Buy price + photo
src/lib/                  API wrappers + business logic
  googleBooks.ts            ISBN -> metadata
  bookscouter.ts            ISBN -> vendor prices (mock fallback included)
  bestbuy.ts                 Live price + photo lookup (mini fridge, microwave only)
  recommendation.ts         Rule-based signal + LLM explanation
  supabaseClient.ts         Browser + service-role Supabase clients
src/components/           PriceTable, PriceHistoryChart, RecommendationBadge,
                           CostSplitCalculator, SearchBar
supabase/schema.sql       items / prices / recommendations tables
data/dorm-items.json      Curated MVP dorm dataset (20 items, 4 categories)
scripts/seed-textbooks.ts Seeds Supabase with a starter ISBN list
```

## Deploying

Push to GitHub, import into Vercel, add the env vars from `.env.example` in
the Vercel project settings, deploy. Free tier is enough for a demo.

## Known MVP limitations (intentional scope cuts — see build plan)

- Dorm prices are hand-curated, not live-scraped, with one exception: the
  mini fridge and microwave pull a live price + photo from the Best Buy
  Products API when `BESTBUY_API_KEY` is set (see above). There's no clean
  free API for cross-retailer pricing generally, and scraping vendor pages
  directly has real ToS/legal risk, so the rest of the catalog stays
  curated. v2 would extend real coverage via additional affiliate APIs
  (Amazon Associates, Walmart) once the site has enough traffic to qualify
  for approval.
- The buy-now/wait signal compares same-day vendor spread, not a real
  rolling price-history low, since there's no accumulated history yet. Once
  the seed script has run for a few weeks, swap the logic in
  `computeSignal()` (`src/lib/recommendation.ts`) for a real 90-day-low
  comparison against the `prices` table.
- No accounts/auth — this is a search tool, not a personalized app, by
  design for the MVP.

## Product framing (for your application)

Lead with the user problem: students re-buy the same predictable
categories — textbooks every term, dorm setup every year — and currently
have to check 3-4 sites by hand to find the best price/format. This product
is one engine (paste an item, get price comparison + a buy-now/wait signal)
applied to two verticals, which is a stronger story than two one-off tools:
it shows you can generalize a mechanism, not just build a single feature.

Worth naming explicitly in interviews: the natural v2 isn't more categories,
it's a browser extension that surfaces this at the point of purchase
(on the Amazon/Chegg product page itself) instead of requiring a trip to a
separate site — but that was deliberately sequenced after validating the
core engine as a web app, since it's a much bigger engineering lift.

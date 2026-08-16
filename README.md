# NU Price Copilot

One comparison engine, two verticals: textbooks (buy/rent/used/ebook across
vendors) and dorm essentials (curated retailer price comparison + roommate
cost-splitting). Scoped to Northwestern University students in Evanston, IL
as the initial launch audience (see "Why Northwestern-only" below). Built as
a portfolio project for APM internship applications; see the "Product
framing" section below for how to talk about it.

## Quick start (runs with zero API keys)

```bash
npm install
cp .env.example .env.local   # leave everything blank to start
npm run dev
```

Open http://localhost:3000. The textbooks search and dorm browser both work
out of the box: book metadata comes from Open Library (no key ever needed),
textbook prices come from a deterministic mock generator until you add a
`SERPAPI_KEY`, and dorm prices come from the curated `data/dorm-items.json`
file. The "buy now vs wait" explanation uses a templated fallback until you
add `ANTHROPIC_API_KEY`.

## Adding real data sources

1. **Open Library API** (textbook metadata: title, author, cover image).
   Free, public, no signup or key ever required. Replaced Google Books
   after unauthenticated requests kept hitting rate limits in testing, and
   after Google Cloud project creation turned out to be blocked on a
   Google Workspace-managed (`.edu`) account, an org-level restriction, not
   something fixable from this project's side. Docs:
   https://openlibrary.org/dev/docs/api/books

2. **SerpApi (Google Shopping)** (cross-vendor textbook prices). Free tier,
   250 searches/month, self-serve with no approval wait: sign up at
   https://serpapi.com/users/sign_up and set `SERPAPI_KEY`. This replaced
   BookScouter as the primary pricing source after BookScouter's developer
   application was rejected outright. BookScouter is still tried as a
   secondary fallback if `BOOKSCOUTER_API_KEY` is set and SerpApi returns
   nothing; see `src/lib/bookscouter.ts` for the priority chain and
   `src/lib/serpapi.ts` for the Google Shopping request/parse logic.

3. **Anthropic API** (plain-language recommendation explanations). Get a key
   at https://console.anthropic.com and set `ANTHROPIC_API_KEY`.

4. **Best Buy Products API** (live price + photo for two dorm items only:
   the mini fridge and microwave). Free, self-serve key at
   https://developer.bestbuy.com/, then set `BESTBUY_API_KEY`. Best Buy
   doesn't carry most of the dorm catalog (bedding, storage, decor,
   furniture), so this stays scoped to appliances rather than replacing
   `data/dorm-items.json` wholesale. See `src/lib/bestbuy.ts` for the
   lookup and `src/app/dorm/page.tsx` for how the live result merges into
   the curated vendor list. Their terms only permit temporary caching
   (response links expire after 7 days), so the fetch uses a short
   `revalidate` window rather than persisting results.

5. **Supabase** (persistence, only needed if you want the seed script to
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
  openLibrary.ts             ISBN -> metadata (Open Library, no key needed)
  serpapi.ts                 Title -> real cross-vendor prices (Google Shopping)
  bookscouter.ts             Orchestrates SerpApi -> BookScouter -> mock fallback
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

## Known MVP limitations (intentional scope cuts, see build plan)

- Dorm prices are hand-curated, not live-scraped, with one exception: the
  mini fridge and microwave pull a live price + photo from the Best Buy
  Products API when `BESTBUY_API_KEY` is set (see above). There's no clean
  free API for cross-retailer pricing generally, and scraping vendor pages
  directly has real ToS/legal risk, so the rest of the catalog stays
  curated. v2 would extend real coverage via additional affiliate APIs
  (Amazon Associates, Walmart) once the site has enough traffic to qualify
  for approval.
- Textbook prices are deterministic mock data until `SERPAPI_KEY` is set,
  clearly labeled "Demo data" vs. "Live" in the UI either way (see
  `src/app/textbooks/page.tsx`).
- The buy-now/wait signal compares same-day vendor spread, not a real
  rolling price-history low, since there's no accumulated history yet. Once
  the seed script has run for a few weeks, swap the logic in
  `computeSignal()` (`src/lib/recommendation.ts`) for a real 90-day-low
  comparison against the `prices` table.
- No accounts/auth. This is a search tool, not a personalized app, by
  design for the MVP.

## Why Northwestern-only

The product is scoped to one campus (Northwestern, Evanston IL) instead of
"students everywhere" on purpose. A few concrete reasons this is a better
starting scope than a generic nationwide tool:

- **A defined first audience makes the product decisions concrete.** "Move-in
  day at Elder or Shepard" is a real, checkable scenario; "dorm essentials
  for any student anywhere" isn't. It just means every decision (which
  vendors, which items, what "essential" means) has no anchor.
- **Distribution is tractable at one school.** Reaching a few hundred NU
  students who search "textbooks Northwestern" or see it shared in a class
  group chat is realistic; reaching students nationally isn't, for a
  single-person project with no marketing budget.
- **The generalization story is still there for interviews:** the
  architecture (one recommendation engine over a `category` field) already
  supports adding a second school without a rewrite; expanding is a data and
  distribution problem, not an engineering one. That's a stronger claim to
  make once there's usage at one school to point to, rather than an
  unvalidated "works for everyone" claim from day one.

## Product framing (for your application)

Lead with the user problem: Northwestern students re-buy the same
predictable categories (textbooks every term, dorm setup every year) and
currently have to check 3-4 sites by hand to find the best price/format.
This product
is one engine (paste an item, get price comparison + a buy-now/wait signal)
applied to two verticals, which is a stronger story than two one-off tools:
it shows you can generalize a mechanism, not just build a single feature.

Worth naming explicitly in interviews: the natural v2 isn't more categories,
it's a browser extension that surfaces this at the point of purchase
(on the Amazon/Chegg product page itself) instead of requiring a trip to a
separate site, but that was deliberately sequenced after validating the
core engine as a web app, since it's a much bigger engineering lift.

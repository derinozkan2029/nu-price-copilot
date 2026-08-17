import Link from "next/link";

export const metadata = {
  title: "Case study",
  description:
    "Why NU Price Copilot exists, how the catalog was researched, and the real tradeoffs behind building it.",
};

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-up space-y-3 border-t border-dashed border-line pt-8">
      <p className="font-mono text-[11px] uppercase tracking-wide text-purple">
        {eyebrow}
      </p>
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl rounded-sm border border-line bg-paper-raised p-4 text-sm leading-relaxed text-ink-soft">
      {children}
    </div>
  );
}

export default function CaseStudyPage() {
  return (
    <div className="space-y-10">
      <div className="animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-purple">
          00 &middot; Case study
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl leading-[1.15] text-ink">
          Why I built this
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          NU Price Copilot is a portfolio project for APM applications, but I
          built it like a real product: real data sources, real tradeoffs
          under real constraints, and an honest line between what's live and
          what's a curated fallback. This page is the story behind the
          decisions, not just the demo.
        </p>
      </div>

      <Section eyebrow="01 · The problem" title="A recurring, checkable decision">
        <p>
          Northwestern students rebuy the same predictable categories,
          textbooks every term, dorm setup every year, and currently check
          three or four sites by hand to find the best price or format. A
          used-versus-rental choice alone can swing $50 or more on a single
          book. That's real money and a real repeated decision, and no
          single tool collapses it into one comparison.
        </p>
      </Section>

      <Section eyebrow="02 · Scoping" title="One campus, on purpose">
        <p>
          I scoped this to Northwestern instead of &quot;students
          everywhere.&quot; A defined audience makes product decisions
          concrete: &quot;move-in day at Elder or Shepard&quot; is a
          checkable scenario, &quot;dorm essentials for any student
          anywhere&quot; isn&apos;t. Distribution is also tractable at one
          school, reaching a few hundred NU students is realistic for a
          single-person project with no marketing budget; reaching students
          nationally isn&apos;t.
        </p>
        <p>
          The generalization story is still there: the architecture (one
          recommendation engine over a category field) already supports a
          second school without a rewrite. That's a stronger claim to make
          once there's real usage at one school to point to, rather than an
          unvalidated &quot;works for everyone&quot; pitch on day one.
        </p>
      </Section>

      <Section
        eyebrow="03 · Research"
        title="Deciding what actually belongs in the catalog"
      >
        <p>
          I didn't want to guess what incoming freshmen buy. For the dorm
          catalog, I researched what's actually trending on TikTok and
          Instagram right now (Dorm Therapy Awards, viral dorm-haul videos,
          sorority big/little gift trends, aesthetic-decor blog roundups),
          cross-checked it against what was already in the catalog to avoid
          duplicates, and deliberately left out recurring consumables
          (detergent sheets, water filters) since they don't fit a
          one-time-purchase, price-comparison tool the way a mini fridge or
          a mattress topper does.
        </p>
        <p>
          For textbooks, I verified all 42 ISBNs against Open Library before
          hardcoding anything, so the grid never shows a mismatched cover
          for the wrong edition.
        </p>
      </Section>

      <Section eyebrow="04 · Tradeoffs" title="Real constraints, real decisions">
        <p>
          A few decisions that came from things breaking, not from a clean
          plan:
        </p>
        <Callout>
          <p className="font-medium text-ink">API access kept failing.</p>
          <p className="mt-1">
            Google Books was blocked by a Google Workspace project-creation
            restriction on my school account. BookScouter's developer
            application was rejected outright. Rather than scrape vendor
            pages directly (real ToS and legal risk), I pivoted twice: Open
            Library for book metadata, SerpApi's Google Shopping engine for
            real cross-vendor prices, both legitimate commercial or public
            data sources instead of a hand-rolled scraper.
          </p>
        </Callout>
        <Callout>
          <p className="font-medium text-ink">
            Honesty over a fake &quot;always live&quot; feel.
          </p>
          <p className="mt-1">
            Every price and photo on the site is labeled Live or Demo data,
            never blurred together. Faking a fully-live product would have
            been easy and would have broken trust the moment someone
            checked a price against the real listing.
          </p>
        </Callout>
        <Callout>
          <p className="font-medium text-ink">
            Scaling the catalog broke production, and the fix wasn't &quot;add
            a delay.&quot;
          </p>
          <p className="mt-1">
            Growing the textbook grid to 42 books meant firing ~40 metadata
            lookups at Open Library on every page load. In production this
            tripped Open Library's rate limiting; requests hung for ~10.5
            seconds and failed, confirmed by reading resource-timing data,
            not by guessing. The real fix wasn't throttling the requests
            slower, it was recognizing that a fixed, curated list doesn't
            need to fetch static metadata live at all. I hardcoded
            title/author/cover data collected during ISBN verification and
            left only the genuinely time-varying part, price, as a live
            call. Cut the failure rate to zero and the API load by 80%.
          </p>
        </Callout>
        <Callout>
          <p className="font-medium text-ink">
            Caught a data-integrity bug before it shipped to users.
          </p>
          <p className="mt-1">
            A bookstore &quot;sell us your book for $0.02&quot; buyback
            listing was slipping into real price results from Google
            Shopping. I noticed it looked wrong, traced it to the source,
            and added a sanity filter (no real product is ever priced under
            $1) rather than trusting the API's data blindly.
          </p>
        </Callout>
      </Section>

      <Section eyebrow="05 · What I'd measure" title="If this had real users">
        <p>
          The site has no usage data yet, so here's what I'd instrument
          first rather than what I've already learned:
        </p>
        <ul className="ml-4 list-disc space-y-1.5 marker:text-purple">
          <li>Click-through rate from a comparison to a vendor link, the actual conversion moment.</li>
          <li>Search abandonment on the textbooks page: ISBN typed but no result opened.</li>
          <li>Category engagement split on the dorm grid, which categories get clicked versus scrolled past.</li>
          <li>Return-visit rate in the week before move-in, the highest-intent window for the whole product.</li>
        </ul>
      </Section>

      <Section eyebrow="06 · What's next" title="Beyond the web app">
        <p>
          The natural v2 isn't more categories, it's a browser extension
          that surfaces this at the point of purchase (on the Amazon or
          Chegg product page itself) instead of requiring a trip to a
          separate site. I sequenced that after validating the core engine
          as a web app on purpose, since it's a much bigger engineering
          lift and I wanted a working product to validate the recommendation
          logic against first.
        </p>
        <p>
          Shorter-term: real historical pricing (the seed script exists but
          hasn't accumulated data yet) would let the buy-now/wait signal
          compare against an actual 90-day low instead of same-day vendor
          spread.
        </p>
      </Section>

      <div className="animate-fade-up flex flex-wrap gap-3 border-t border-dashed border-line pt-8">
        <Link
          href="/"
          className="rounded-sm border border-line px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink-soft transition-colors hover:border-purple hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
        >
          Back to the product
        </Link>
        <a
          href="https://github.com/derinozkan2029/nu-price-copilot"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm border border-line px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink-soft transition-colors hover:border-purple hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
        >
          View the code
        </a>
      </div>
    </div>
  );
}

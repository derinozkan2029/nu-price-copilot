import Link from "next/link";
import { ScrollProgress } from "@/components/ScrollProgress";

export const metadata = {
  title: "Case study",
  description:
    "The real story behind NU Price Copilot: a move-in that didn't go as planned, how the catalog was researched, and the tradeoffs behind building it.",
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
      <ScrollProgress className="fixed inset-x-0 top-0 z-50 h-1 bg-purple" />
      <div className="animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-purple">
          00 &middot; Case study
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl leading-[1.15] text-ink">
          Why I built this
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          This came out of my own move-in to Northwestern, not a product
          brainstorm. I forgot things I swore I'd already packed, overpaid
          for the things I remembered, and never once checked whether
          renting a textbook was cheaper than buying it. This page is the
          real story behind the decisions, including how it was actually
          built.
        </p>
      </div>

      <Section
        eyebrow="01 · The problem"
        title="Forgetting things, and overpaying for the rest"
      >
        <p>
          Move-in week was a blur of late CVS and Target runs for stuff I'd
          already told myself I had: a shower caddy, extra hangers, a
          mattress topper I didn't know I'd need until the first night on a
          dorm mattress. That's the first problem, you don't find out what
          you're missing until you're already missing it.
        </p>
        <p>
          The second problem showed up every term after: rebuying textbooks
          without ever checking if a rental or a used copy was cheaper, a
          used-versus-rental choice alone can swing $50 or more on a single
          book, and buying dorm items from whichever site came up first
          instead of comparing. Both problems are really the same one: no
          single place to see what you need and what it actually costs
          before you're standing in a Target aisle at 9pm.
        </p>
      </Section>

      <Section
        eyebrow="02 · Scoping"
        title="Northwestern first, because that's where I am"
      >
        <p>
          I scoped this to Northwestern because I'm a Northwestern student,
          it's the campus I actually know: the residence halls, what Norris
          charges versus Amazon, what move-in day into Elder or Shepard
          actually looks like. Building for &quot;students everywhere&quot;
          first would have meant guessing at all of that instead of
          checking it against my own experience.
        </p>
        <p>
          The plan is to expand to other campuses once this is working well
          here. The architecture (one recommendation engine over a category
          field, not campus-specific logic) already supports a second
          school without a rewrite, adding one is mostly a data problem:
          new dorm names, new curated items, a new set of ISBNs. I'd rather
          prove it out on the campus I can personally validate first.
        </p>
      </Section>

      <Section
        eyebrow="03 · Research"
        title="Deciding what actually belongs in the catalog"
      >
        <p>
          I didn't want to rely only on my own move-in to decide what goes
          in the dorm catalog, one person's experience misses a lot. So I
          researched what's actually trending on TikTok and Instagram right
          now (Dorm Therapy Awards, viral dorm-haul videos, sorority
          big/little gift trends, aesthetic-decor blog roundups),
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

      <Section
        eyebrow="05 · How this was built"
        title="Vibecoded, on purpose, and I'll say so"
      >
        <p>
          I built this with Claude Code doing most of the typing, not by
          hand-writing every line. I'm not going to pretend otherwise. What
          I actually did: decided what problem this solves and for whom,
          scoped what goes in the catalog and what doesn't, wrote the
          research prompts and judged which results were actually good
          matches, caught the data-integrity bug above by noticing a price
          looked wrong, diagnosed the production rate-limit failure from
          real timing data, and decided the structural fix instead of
          reaching for a quick patch.
        </p>
        <p>
          The AI handled a lot of the implementation. I think that's
          increasingly just how building works, and I'd rather be upfront
          about the split than let the polish imply I wrote every line
          myself.
        </p>
      </Section>

      <Section eyebrow="06 · What I'd measure" title="If this had real users">
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

      <Section eyebrow="07 · What's next" title="Beyond the web app">
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
          spread. Longer-term: expanding past Northwestern once the catalog
          and recommendation logic have actually been proven here.
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

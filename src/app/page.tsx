import Link from "next/link";
import { Hero } from "@/components/Hero";

const toc = [
  {
    href: "/textbooks",
    title: "Textbooks",
    cta: "Compare now",
    description:
      "Search by ISBN or title before you buy at Norris or online. Compare new, used, rental, and ebook prices in one ledger.",
  },
  {
    href: "/dorm",
    title: "Dorm essentials",
    cta: "Browse items",
    description:
      "Everything for move-in day at Allison, Elder, Shepard, or any NU residence hall. Compare retailers and split costs with a roommate.",
  },
  {
    href: "/decorate",
    title: "Decorate your room",
    cta: "Start decorating",
    description:
      "Pick a theme — boho, preppy, coastal cowgirl, and more — and build your dream dorm live, with real items and prices pulled in as you go.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <Hero />

      <section className="space-y-1">
        <p className="animate-fade-up font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
          In this issue
        </p>

        <nav aria-label="Site sections" className="border-t border-line">
          {toc.map((entry, i) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="animate-fade-up group block border-b border-line py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
              style={{ animationDelay: `${380 + i * 90}ms` }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:flex-nowrap sm:gap-x-4">
                <span className="font-mono text-xs text-ink-faint">
                  0{i + 1}
                </span>
                <h2 className="font-display text-2xl text-ink transition-colors group-hover:text-purple sm:text-3xl">
                  {entry.title}
                </h2>
                <span
                  aria-hidden
                  className="hidden flex-1 translate-y-[-4px] border-b-2 border-dotted border-ink-faint/40 sm:block"
                />
                <span className="shrink-0 font-mono text-xs uppercase tracking-wide text-purple">
                  {entry.cta} &rarr;
                </span>
              </div>
              <p className="mt-2 max-w-xl pl-8 text-sm leading-relaxed text-ink-soft sm:pl-9">
                {entry.description}
              </p>
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}

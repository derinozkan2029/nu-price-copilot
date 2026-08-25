import type { Metadata } from "next";
import { Fraunces, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { NavLinks } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const DESCRIPTION =
  "Buy-now-or-wait price comparisons for textbooks and dorm essentials, built for Northwestern Wildcats in Evanston, IL.";

export const metadata: Metadata = {
  title: {
    default: "NU Price Copilot",
    template: "%s | NU Price Copilot",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "NU Price Copilot",
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NU Price Copilot",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:text-paper"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-10 bg-paper">
          <div className="border-b border-dashed border-line">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              <span>Evanston, IL</span>
              <span className="hidden sm:inline">
                Wildcat Welcome Edition &middot; Fall 2026
              </span>
            </div>
          </div>
          <div className="mx-auto flex max-w-6xl flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <Link
              href="/"
              className="group flex items-center gap-2.5 self-start rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink font-mono text-sm font-semibold text-paper transition-colors group-hover:bg-purple">
                N
              </span>
              <span className="whitespace-nowrap font-display text-base leading-none text-ink sm:text-lg">
                NU Price <em className="not-italic text-purple">Copilot</em>
              </span>
            </Link>
            <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-5">
              <NavLinks />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          {children}
        </main>

        <footer className="border-t border-dashed border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono uppercase tracking-[0.14em]">
              One engine &middot; two categories &middot; zero overpaying
            </p>
            <p>Built for Wildcats in Evanston, IL. Starting at NU before scaling campus-wide.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Price Copilot",
  description:
    "Buy-now-or-wait price comparisons for textbooks and dorm essentials.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-brand-700">
              Student Price Copilot
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-slate-600">
              <Link href="/textbooks" className="hover:text-brand-600">
                Textbooks
              </Link>
              <Link href="/dorm" className="hover:text-brand-600">
                Dorm
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

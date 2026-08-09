import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Textbooks",
  description:
    "Search by ISBN to compare new, used, rental, and ebook textbook prices across vendors, with a buy-now-or-wait recommendation.",
};

export default function TextbooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dorm Essentials",
  description:
    "Browse common dorm move-in items, compare prices across retailers, and split shared-item costs with a roommate.",
};

export default function DormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

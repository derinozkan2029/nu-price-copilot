import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decorate Your Room",
  description:
    "Pick a dorm decor theme and build your dream room live, with real items and prices pulled in as you decorate.",
};

export default function DecorateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

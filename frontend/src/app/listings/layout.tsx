import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore | Eventvnv",
  description: "Explore curated Lagos venues and services for unforgettable events.",
};

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

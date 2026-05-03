import type { Metadata } from "next";
import ExploreMarketplace from "@/features/listings/pages/ExploreMarketplace";

export const metadata: Metadata = {
  title: "Explore | Eventvnv",
  description: "Explore curated Lagos venues and services for unforgettable events.",
};

export default function ListingsPage() {
  return <ExploreMarketplace />;
}

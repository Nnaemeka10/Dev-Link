import { Suspense } from "react";
import type { Metadata } from "next";
import ExploreMarketplace from "@/features/listings/pages/ExploreMarketplace";

export const metadata: Metadata = {
  title: "Explore | Eventvnv",
  description: "Explore curated Lagos venues and services for unforgettable events.",
};

export default function ListingsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <ExploreMarketplace />
    </Suspense>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import HallDetails from "@/features/listings/pages/HallDetails";

export const metadata: Metadata = {
  title: "Listings Details | Eventvnv",
  description: "View listing details with Eventvnv.",
};

export default function ListingsDetailsRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <HallDetails />
    </Suspense>
  );
}

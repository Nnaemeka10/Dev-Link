import { Suspense } from "react";
import type { Metadata } from "next";
import GrandAtriumDetailsPage from "@/features/bookings/pages/GrandAtriumDetailsPage";

export const metadata: Metadata = {
  title: "Listings Details | Eventvnv",
  description: "View listing details with Eventvnv.",
};

export default function ListingsDetailsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <GrandAtriumDetailsPage />
    </Suspense>
  );
}

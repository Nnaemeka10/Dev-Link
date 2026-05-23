import { Suspense } from "react";
import type { Metadata } from "next";
import GrandAtriumBookingPage from "@/features/bookings/pages/GrandAtriumBookingPage";

export const metadata: Metadata = {
  title: "Listings Details | Eventvnv",
  description: "View listing details with Eventvnv.",
};

export default function ListingsDetailsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <GrandAtriumBookingPage />
    </Suspense>
  );
}

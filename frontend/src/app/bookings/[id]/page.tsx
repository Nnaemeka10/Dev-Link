import { Suspense } from "react";
import type { Metadata } from "next";
import GrandAtriumBookingPage from "@/features/bookings/pages/GrandAtriumDetailsPage";

export const metadata: Metadata = {
  title: "Booking Details | Eventvnv",
  description: "View booking details with Eventvnv.",
};

export default function ListingsDetailsRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
         <GrandAtriumBookingPage />
    </Suspense>
  );
}

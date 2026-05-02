import { Suspense } from "react";
import type { Metadata } from "next";
import GrandAtriumBookingPage from "@/features/bookings/pages/GrandAtriumBookingPage";

export const metadata: Metadata = {
  title: "Secure Booking | Eventvnv",
  description: "Complete your Grand Atrium booking with Eventvnv.",
};

export default function BookingRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <GrandAtriumBookingPage />
    </Suspense>
  );
}

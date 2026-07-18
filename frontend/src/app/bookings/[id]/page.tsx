import { Suspense } from "react";
import type { Metadata } from "next";
import BookingDetails from "@/features/bookings/pages/BookingDetails";

export const metadata: Metadata = {
  title: "Booking Details | Eventvnv",
  description: "View booking details with Eventvnv.",
};

export default function ListingsDetailsRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
         <BookingDetails />
    </Suspense>
  );
}

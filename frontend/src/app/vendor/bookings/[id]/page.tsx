import type { Metadata } from "next";
import AuthGuard from "@/features/auth/AuthGuard";
import VendorBookingDetailPage from "@/features/vendor/pages/VendorBookingDetailPage";

export const metadata: Metadata = {
  title: "Booking details | Eventvnv Host",
  description: "Everything you need to confirm, deliver and get paid for a booking.",
};

export default function VendorBookingDetailRoute() {
  return (
    <AuthGuard>
      <VendorBookingDetailPage />
    </AuthGuard>
  );
}
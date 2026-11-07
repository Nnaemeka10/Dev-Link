import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import TermsPage from "@/features/legal/pages/TermsPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | Eventvnv",
  description:
    "The terms that govern bookings, listings, escrow payments and vendor payouts on the EventVnV marketplace.",
};

export default function TermsRoute() {
  return (
    <>
      <Navbar />
      <TermsPage />
    </>
  );
}
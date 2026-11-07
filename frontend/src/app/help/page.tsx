import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import HelpCenterPage from "@/features/helpCenter/pages/HelpCenterPage";

export const metadata: Metadata = {
  title: "Help Center | Eventvnv",
  description:
    "Answers to common questions about bookings, payments, escrow, listings, cancellations and safety on EventVnV.",
};

export default function HelpRoute() {
  return (
    <>
      <Navbar />
      <HelpCenterPage />
    </>
  );
}
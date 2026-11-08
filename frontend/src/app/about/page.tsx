import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import AboutPage from "@/features/legal/pages/AboutPage";

export const metadata: Metadata = {
  title: "About Us | Eventvnv",
  description:
    "EventVnV is Nigeria's premier event concierge , one marketplace for event halls and services, with escrow-protected payments.",
};

export default function AboutRoute() {
  return (
    <>
      <Navbar />
      <AboutPage />
    </>
  );
}
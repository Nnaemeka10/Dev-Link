import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import PrivacyPolicyPage from "@/features/legal/pages/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Eventvnv",
  description:
    "How EventVnV collects, uses and protects your personal data, in line with the Nigeria Data Protection Act (NDPA) 2023.",
};

export default function PrivacyRoute() {
  return (
    <>
      <Navbar />
      <PrivacyPolicyPage />
    </>
  );
}
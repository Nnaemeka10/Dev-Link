import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import CookiePolicyPage from "@/features/legal/pages/CookiePolicyPage";

export const metadata: Metadata = {
  title: "Cookie Policy | Eventvnv",
  description:
    "Every cookie and browser storage key EventVnV uses, what it does, how long it lasts and how to control it.",
};

export default function CookiesRoute() {
  return (
    <>
      <Navbar />
      <CookiePolicyPage />
    </>
  );
}
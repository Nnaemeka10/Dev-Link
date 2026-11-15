import { Suspense } from "react";
import type { Metadata } from "next";
import SavedPage from "@/features/saved/pages/Savedpage";
import AuthGuard from "@/features/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Saved & Bookings | Eventvnv",
  description: "Your saved listings and bookings on Eventvnv.",
};

export default function SavedRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <AuthGuard>
        <SavedPage />
      </AuthGuard>
    </Suspense>
  );
}
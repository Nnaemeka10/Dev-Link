import { Suspense } from "react";
import type { Metadata } from "next";
import SavedListings from "@/features/listings/pages/SavedListings";
import AuthGuard from "@/features/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Listings Details | Eventvnv",
  description: "View listing details with Eventvnv.",
};

export default function ListingsDetailsRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <AuthGuard >
        <SavedListings />
      </AuthGuard>
    </Suspense>
  );
}

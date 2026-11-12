import { Suspense } from "react";
import type { Metadata } from "next";
import ListingPhotos from "@/features/listings/pages/ListingPhotos";

export const metadata: Metadata = { title: "All Photos | Eventvnv" };

export default function PhotosRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <ListingPhotos />
    </Suspense>
  );
}
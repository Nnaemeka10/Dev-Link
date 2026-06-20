import { Suspense } from "react";
import type { Metadata } from "next";
import ServiceDetails from "@/features/listings/pages/ServiceDetails";

export const metadata: Metadata = {
  title: "Service Details | Eventvnv",
  description: "View service details with Eventvnv.",
};

export default function ServiceDetailsRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <ServiceDetails />
    </Suspense>
  );
}


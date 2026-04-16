import { Suspense } from "react";
import type { Metadata } from "next";
import ListingsResults from "@/features/listings/components/ListingsResults";
import ListingsSkeleton from "@/features/listings/components/ListingsSkeleton";
import {
  getListingCategoryLabel,
  type ListingSearchParams,
} from "@/features/listings/searchParams";

export const metadata: Metadata = {
  title: "Listings | eventvnv",
  description: "Explore curated halls and services for unforgettable events.",
};

interface ListingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildMetadataDescription(search: ListingSearchParams): string {
  const heading = getListingCategoryLabel(search.category).toLowerCase();

  if (search.location) {
    return `Explore ${heading} available in ${search.location} on eventvnv.`;
  }

  return `Explore curated ${heading} for unforgettable events on eventvnv.`;
}

// export async function generateMetadata({ searchParams }: ListingsPageProps): Promise<Metadata> {
//   const resolvedSearchParams = await searchParams;
//   const search = normalizeListingSearchParams(resolvedSearchParams);
//   const heading = getListingCategoryLabel(search.category);

//   return {
//     title: search.location ? `${heading} in ${search.location} | eventvnv` : `${heading} | eventvnv`,
//     description: buildMetadataDescription(search),
//   };
// }

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  return (
    <Suspense fallback={<ListingsSkeleton />}>
      <ListingsResults searchParams={searchParams} />
    </Suspense>
  );
}

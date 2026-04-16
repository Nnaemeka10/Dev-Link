import ListingCard from "@/features/listings/components/ListingCard";
import { getListings } from "@/features/listings/listings.api";
import Listings from "@/features/listings/pages/Listings";
import { normalizeListingSearchParams } from "@/features/listings/searchParams";

interface ListingsResultsProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListingsResults({ searchParams }: ListingsResultsProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeListingSearchParams(resolvedSearchParams);
  const listings = await getListings(search);

  if (listings.length === 0) {
    return (
      <Listings search={search}>
        <section className="rounded-[28px] border border-dashed border-text-primary/15 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-text-primary">No matches yet</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-text-primary/70">
            Try broadening the location or clearing the date filter. The results page will stay shareable because
            the current search lives entirely in the URL.
          </p>
        </section>
      </Listings>
    );
  }

  return (
    <Listings search={search}>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>
    </Listings>
  );
}

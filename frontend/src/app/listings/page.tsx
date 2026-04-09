import type { Metadata } from "next";
import ListingCard from "@/features/listings/components/ListingCard";
import { getListings } from "@/features/listings/listings.api";

export const metadata: Metadata = {
  title: "Listings | eventvnv",
  description: "Explore curated halls and services for unforgettable events.",
};

export default async function ListingsPage() {
  const listings = await getListings();

  const halls = listings.filter((listing) => listing.category === "hall");
  const services = listings.filter((listing) => listing.category === "service");

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-12">
      <section>
        <h1 className="text-[32px] font-semibold text-text-primary">Explore listings</h1>
        <p className="mt-2 text-base text-text-primary/80">
          Discover halls and services independently so planning stays clear and structured.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text-primary">Halls</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {halls.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text-primary">Services</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}

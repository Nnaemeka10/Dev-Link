import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { GRAND_ATRIUM_DETAILS, GRAND_ATRIUM_ID } from "@/features/listings/details.data";
import GrandAtriumDetailsPage from "@/features/listings/pages/GrandAtriumDetailsPage";
import { getListingById, getListingIds } from "@/features/listings/listings.api";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const ids = await getListingIds();
  return Array.from(new Set([...ids, GRAND_ATRIUM_ID])).map((id) => ({ id }));
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;

  if (id === GRAND_ATRIUM_ID) {
    return {
      title: `${GRAND_ATRIUM_DETAILS.name} | Eventvnv`,
      description: GRAND_ATRIUM_DETAILS.description[0],
      openGraph: {
        title: `${GRAND_ATRIUM_DETAILS.name} | Eventvnv`,
        description: GRAND_ATRIUM_DETAILS.description[0],
      },
    };
  }

  const listing = await getListingById(id);

  if (!listing) {
    return {
      title: "Listing not found | eventvnv",
    };
  }

  return {
    title: `${listing.title} | eventvnv`,
    description: listing.description,
    openGraph: {
      title: `${listing.title} | eventvnv`,
      description: listing.description,
    },
  };
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { id } = await params;

  if (id === GRAND_ATRIUM_ID) {
    return <GrandAtriumDetailsPage />;
  }

  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <Card className="space-y-5">
        <span className="inline-flex rounded-full bg-bg-secondary px-4 py-1 text-xs font-medium text-text-primary">
          {listing.category === "hall" ? "Hall" : "Service"}
        </span>
        <h1 className="text-[32px] font-semibold text-text-primary">{listing.title}</h1>
        <p className="text-base text-text-primary/80">{listing.description}</p>

        <div className="grid gap-4 text-sm text-text-primary/80 md:grid-cols-2">
          <div>
            <p className="font-medium text-text-primary">Location</p>
            <p>{listing.location}</p>
          </div>
          <div>
            <p className="font-medium text-text-primary">Starting price</p>
            <p>NGN {listing.priceFrom.toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="primary">Start booking conversation</Button>
        </div>
      </Card>
    </main>
  );
}

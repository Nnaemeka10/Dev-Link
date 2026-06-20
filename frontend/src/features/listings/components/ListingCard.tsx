import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Listing } from "../../home/types/listings.types";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Card className="flex h-full flex-col justify-between gap-4">
      <div className="space-y-2">
        <span className="inline-flex rounded-full bg-bg-secondary px-4 py-1 text-xs font-medium text-text-primary">
          {listing.category === "hall" ? "Hall" : "Service"}
        </span>
        <h3 className="text-xl font-semibold text-text-primary">{listing.title}</h3>
        <p className="text-sm text-text-primary/70">{listing.location}</p>
        <p className="text-sm text-text-primary/80">{listing.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-primary">
          From <span className="font-semibold">NGN {listing.priceFrom.toLocaleString()}</span>
        </p>
        <Link href={`/listings/${listing.category === "hall" ? "halls" : "services"}/${listing.id}`}>
          <Button variant="secondary">View details</Button>
        </Link>
      </div>
    </Card>
  );
}

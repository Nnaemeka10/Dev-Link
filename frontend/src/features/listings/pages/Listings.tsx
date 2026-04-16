import type { ReactNode } from "react";
import { getListingCategoryLabel, type ListingSearchParams } from "@/features/listings/searchParams";

interface ListingsProps {
  search: ListingSearchParams;
  children: ReactNode;
}

function formatDateLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Listings({ search, children }: ListingsProps) {
  const heading = getListingCategoryLabel(search.category);
  const hasDateRange = Boolean(search.dateFrom || search.dateTo);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-12">
      <section className="space-y-3">
        <span className="inline-flex rounded-full bg-bg-secondary px-4 py-1 text-xs font-medium uppercase tracking-[0.08em] text-text-primary">
          Search results
        </span>
        <div className="space-y-2">
          <h1 className="text-[32px] font-semibold text-text-primary md:text-[40px]">{heading}</h1>
          <p className="max-w-3xl text-base text-text-primary/80">
            {search.location
              ? `Showing ${heading.toLowerCase()} matching ${search.location}.`
              : `Showing all ${heading.toLowerCase()} available for discovery.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className="inline-flex rounded-full border border-text-primary/10 bg-white px-4 py-2 text-sm text-text-primary">
            Category: {heading}
          </span>
          {search.location && (
            <span className="inline-flex rounded-full border border-text-primary/10 bg-white px-4 py-2 text-sm text-text-primary">
              Location: {search.location}
            </span>
          )}
          {hasDateRange && (
            <span className="inline-flex rounded-full border border-text-primary/10 bg-white px-4 py-2 text-sm text-text-primary">
              Dates: {search.dateFrom ? formatDateLabel(search.dateFrom) : "Any time"}
              {search.dateTo ? ` - ${formatDateLabel(search.dateTo)}` : ""}
            </span>
          )}
        </div>
      </section>

      {children}
    </main>
  );
}

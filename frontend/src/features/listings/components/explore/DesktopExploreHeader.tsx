"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import DesktopSearchBar from "@/features/search/components/DesktopSearchBar";
import CollapsedSearchPill from "@/features/search/components/CollapsedSearchPill";
import { useScrollCollapse, formatTriggerLabel } from "@/features/search";
import FilterModal from "@/features/listings/components/FilterModal";
import { SortDropdown } from "./SortDropdown";

import { buildListingsHref, normalizeListingSearchParams } from "@/features/listings/searchParams";
import type { FilterState } from "@/features/listings/components/FilterModal";
import type { SortBy, SortOrder } from "@/features/listings/searchParams";
import type { SearchFormData } from "@/features/search/utils/searchSchema";
import type { useSearchForm } from "@/features/search";

interface DesktopExploreHeaderProps {
  handleSearch: (data: SearchFormData) => void;
  form: ReturnType<typeof useSearchForm>;
  isPending: boolean;
  filter?: boolean;
  category: "halls" | "services";
}

export function DesktopExploreHeader({ handleSearch, form, isPending, filter, category }: DesktopExploreHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { collapsed, expand } = useScrollCollapse(120);

  // Summary for the collapsed pill.
  const location = form.watch("location");
  const coverageArea = form.watch("coverageArea");
  const dateRange = form.watch("dateRange");
  const flexible = form.watch("flexible");
  const capacity = form.watch("capacity");
  const role = form.watch("role");

  const summary = [
    (category === "halls" ? location : coverageArea) || role || "",
    formatTriggerLabel(dateRange) + (formatTriggerLabel(dateRange) && flexible ? ` ±${flexible}d` : ""),
    capacity ? `${capacity} guests` : "",
  ].filter(Boolean);

  const currentFilters: Partial<FilterState> = {
    priceMin: searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : undefined,
    priceMax: searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined,
    capacityMin: searchParams.get("capacityMin") ? Number(searchParams.get("capacityMin")) : undefined,
    capacityMax: searchParams.get("capacityMax") ? Number(searchParams.get("capacityMax")) : undefined,
    minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
    verified: searchParams.get("verified") === "true",
    venueTypes: searchParams.get("venueTypes")?.split(",").filter(Boolean),
    amenities: searchParams.get("amenities")?.split(",").filter(Boolean),
    coverageArea: searchParams.get("coverage") || searchParams.get("location") || undefined,
  };

  const handleApplyFilters = (filters: FilterState) => {
    const params = normalizeListingSearchParams({
      category: searchParams.get("category") || "halls",
      location: filters.coverageArea || searchParams.get("location") || undefined,
      coverage: searchParams.get("coverage") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      flexible: searchParams.get("flexible") || undefined,
      capacity: searchParams.get("capacity") || undefined,
      role: searchParams.get("role") || undefined,
      sort: searchParams.get("sort") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    router.push(
      buildListingsHref({
        ...params,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        capacityMin: filters.capacityMin,
        capacityMax: filters.capacityMax,
        minRating: filters.minRating,
        verified: filters.verified,
        venueTypes: filters.venueTypes,
        amenities: filters.amenities,
      })
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 shrink-0 border-b border-[#EDE4D8] bg-bg-primary/95 backdrop-blur">
        <div className="flex items-center gap-4 px-4 py-4 xl:gap-8 xl:px-8 xl:py-6">
          {collapsed ? (
            <CollapsedSearchPill summary={summary} onExpand={expand} />
          ) : (
            <DesktopSearchBar form={form} onSubmit={handleSearch} isPending={isPending} showShadow />
          )}

          {filter && (
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FFDFA7] px-4 py-2 text-xs font-extrabold transition-all hover:brightness-95 xl:px-6 xl:py-3 xl:text-sm"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
              Filters
            </button>
          )}
        </div>
      </header>

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={currentFilters}
        category={category}
      />
    </>
  );
}

export function DesktopResultsHeader({
  count,
  locationLabel,
  listingType,
}: {
  count: number;
  locationLabel: string;
  listingType: "hall" | "service";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = normalizeListingSearchParams({
    category: searchParams.get("category") || "halls",
    location: searchParams.get("location") || undefined,
    coverage: searchParams.get("coverage") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    flexible: searchParams.get("flexible") || undefined,
    capacity: searchParams.get("capacity") || undefined,
    role: searchParams.get("role") || undefined,
    sort: searchParams.get("sort") || undefined,
    sortOrder: searchParams.get("sortOrder") || undefined,
  });

  const handleSort = (sort: SortBy, sortOrder: SortOrder) => {
    router.push(buildListingsHref({ ...params, sort, sortOrder }));
  };

  const noun = listingType === "hall" ? "venue" : "service";
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-text-primary">
          {listingType === "hall" ? "Venues" : "Services"} in {locationLabel}
        </h2>
        <p className="mt-1 text-sm text-[#555B7F]">
          {count} {count === 1 ? `premium ${noun}` : `premium ${noun}s`} found for your event
        </p>
      </div>
      <SortDropdown
        currentSort={params.sort}
        currentSortOrder={params.sortOrder}
        onSort={handleSort}
      />
    </div>
  );
}
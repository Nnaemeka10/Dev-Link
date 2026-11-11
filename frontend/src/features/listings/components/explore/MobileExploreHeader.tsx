"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import FilterModal, {
  PRICE_MIN_BOUND,
  PRICE_MAX_BOUND,
} from "@/features/listings/components/FilterModal";
import type { FilterState } from "@/features/listings/components/FilterModal";
import { MobileSearchModal, MobileSearchTrigger } from "@/features/search";
import type { SearchFormData } from "@/features/search/utils/searchSchema";
import type { useSearchForm } from "@/features/search";
import { SortDropdown } from "./SortDropdown";
import { buildListingsHref, normalizeListingSearchParams } from "@/features/listings/searchParams";
import type { SortBy, SortOrder } from "@/features/listings/searchParams";

interface MobileExploreHeaderProps {
  handleSearch: (data: SearchFormData) => void;
  form: ReturnType<typeof useSearchForm>;
  isPending: boolean;
  mobileSummary: { label: string; value: string }[];
  category: "halls" | "services";
}

export default function MobileExploreHeader({
  category,
  handleSearch,
  form,
  isPending,
  mobileSummary,
}: MobileExploreHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isServices = category === "services";

  const currentFilters: Partial<FilterState> = {
    priceMin: searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : undefined,
    priceMax: searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined,
    capacityMin: searchParams.get("capacityMin") ? Number(searchParams.get("capacityMin")) : undefined,
    capacityMax: searchParams.get("capacityMax") ? Number(searchParams.get("capacityMax")) : undefined,
    minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
    verified: searchParams.get("verified") === "true",
    venueTypes: searchParams.get("venueTypes")?.split(",").filter(Boolean),
    amenities: searchParams.get("amenities")?.split(",").filter(Boolean),
    // Services keep their area in `coverage`, halls in `location`.
    coverageArea: (isServices ? searchParams.get("coverage") : searchParams.get("location")) || undefined,
  };

  // New URL - new query key - pagination restarts from page one.
  const handleApplyFilters = (filters: FilterState) => {
    const params = normalizeListingSearchParams({
      category: searchParams.get("category") || "halls",
      location: isServices ? undefined : searchParams.get("location") || undefined,
      coverage: isServices
        ? filters.coverageArea || searchParams.get("coverage") || undefined
        : undefined,
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
        priceMin: filters.priceMin > PRICE_MIN_BOUND ? filters.priceMin : undefined,
        priceMax: filters.priceMax < PRICE_MAX_BOUND ? filters.priceMax : undefined,
        capacityMin: !isServices && filters.capacityMin > 0 ? filters.capacityMin : undefined,
        capacityMax: !isServices && filters.capacityMax > 0 ? filters.capacityMax : undefined,
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        verified: filters.verified,
        venueTypes: isServices ? undefined : filters.venueTypes,
        amenities: isServices ? undefined : filters.amenities,
      }),
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-col gap-8 bg-bg-primary/95 px-6 py-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-end gap-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary"
          >
            <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
            <p className="logo translate-y-1.5 font-semibold">EventVnV</p>
          </Link>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="text-[#B9401D] transition-opacity active:opacity-70"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        <MobileSearchTrigger mobileSummaryLines={mobileSummary} />
        <MobileSearchModal onSubmit={handleSearch} form={form} isPending={isPending} />
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

export function MobileResultsHeader({
  count,
  hasMore = false,
  locationLabel,
  listingType,
  roleLabel,
}: {
  count: number;
  hasMore?: boolean;
  locationLabel: string;
  listingType: "hall" | "service";
  roleLabel?: string;
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
    priceMin: searchParams.get("priceMin") || undefined,
    priceMax: searchParams.get("priceMax") || undefined,
    capacityMin: searchParams.get("capacityMin") || undefined,
    capacityMax: searchParams.get("capacityMax") || undefined,
    minRating: searchParams.get("minRating") || undefined,
    verified: searchParams.get("verified") || undefined,
    venueTypes: searchParams.get("venueTypes") || undefined,
    amenities: searchParams.get("amenities") || undefined,
  });

  const handleSort = (sort: SortBy, sortOrder: SortOrder) => {
    router.push(buildListingsHref({ ...params, sort, sortOrder }));
  };

  const suffix = hasMore ? "+" : "";
  const heading = listingType === "hall" ? "Venues" : roleLabel ?? "All Services";
  const noun =
    listingType === "hall"
      ? count === 1 && !hasMore
        ? "premium space"
        : "premium spaces"
      : count === 1 && !hasMore
        ? "service"
        : "services";

  return (
    <div className="mb-6 flex items-start justify-between gap-3 px-6 py-4">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-extrabold tracking-[-0.02em] text-text-primary">
          {heading} in {locationLabel}
        </h2>
        <p className="mt-1 text-tiny text-[#555B7F]">
          {count}
          {suffix} {noun} found for your event
        </p>
      </div>

      <div className="shrink-0 pt-1">
        <SortDropdown currentSort={params.sort} currentSortOrder={params.sortOrder} onSort={handleSort} />
      </div>
    </div>
  );
}
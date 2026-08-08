"use client";

import { ListFilter, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import FilterModal from "../FilterModal";
import type { FilterState } from "@/features/listings/components/FilterModal";
import { useState } from "react";
import { MobileSearchModal, MobileSearchTrigger, useSearchForm } from "@/features/search";
import { SearchFormData } from "@/features/search/utils/searchSchema";
import { SortDropdown } from "./SortDropdown";
import { buildListingsHref, normalizeListingSearchParams } from "@/features/listings/searchParams";
import type { SortBy, SortOrder } from "@/features/listings/searchParams";



interface MobileExploreHeaderProps {
  handleSearch: (data: SearchFormData) => void;
  form: ReturnType<typeof useSearchForm>;
  isPending: boolean;
  mobileSummary: string[]; // Array of lines for mobile summary display
}


export default function MobileExploreHeader({
 handleSearch,
 form,
 isPending,
 mobileSummary,
}: MobileExploreHeaderProps) {

  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const currentFilters: Partial<FilterState> = {
    priceMin: searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : undefined,
    priceMax: searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined,
    capacityMin: searchParams.get("capacityMin") ? Number(searchParams.get("capacityMin")) : undefined,
    capacityMax: searchParams.get("capacityMax") ? Number(searchParams.get("capacityMax")) : undefined,
    minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
    verified: searchParams.get("verified") === "true",
    venueTypes: searchParams.get("venueTypes")?.split(",").filter(Boolean),
    amenities: searchParams.get("amenities")?.split(",").filter(Boolean),
  };

  const handleApplyFilters = (filters: FilterState) => {
    const params = normalizeListingSearchParams({
      category: searchParams.get("category") || "halls",
      location: searchParams.get("location") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      capacity: searchParams.get("capacity") || undefined,      
      role: searchParams.get("role") || undefined,               
      sort: searchParams.get("sort") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });


    router.push(buildListingsHref({
      ...params,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      capacityMin: filters.capacityMin,
      capacityMax: filters.capacityMax,
      minRating: filters.minRating,
      verified: filters.verified,
      venueTypes: filters.venueTypes,
      amenities: filters.amenities,
    }));
  };


  return (
    <>
      <header className="sticky top-0 z-30 bg-bg-primary/95 px-6 py-5 backdrop-blur flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
            <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
            <p className="font-semibold logo translate-y-1.5">EventVnV </p>
          </Link>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="text-[#B9401D]"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
        
        <MobileSearchTrigger mobileSummaryLines={mobileSummary} />
        <MobileSearchModal onSubmit={handleSearch} form={form} isPending={isPending} />
      </header>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApplyFilters={handleApplyFilters} initialFilters={currentFilters} />
    </>
  );
}


export function MobileResultsHeader({count, locationLabel, listingType} : {count: number, locationLabel: string, listingType: string}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function nullableToUndefined(value: string | null) {
    return value ?? undefined;
  }

  const params = normalizeListingSearchParams({
    category: searchParams.get("category") || "halls",
    location: nullableToUndefined(searchParams.get("location")),
    dateFrom: nullableToUndefined(searchParams.get("dateFrom")),
    dateTo: nullableToUndefined(searchParams.get("dateTo")),
    capacity: nullableToUndefined(searchParams.get("capacity")),
    role: nullableToUndefined(searchParams.get("role")),
    sort: nullableToUndefined(searchParams.get("sort")),
    sortOrder: nullableToUndefined(searchParams.get("sortOrder")),
  });

  const handleSort = (sort: SortBy, sortOrder: SortOrder) => {
    const newParams = {
      ...params,
      sort,
      sortOrder,
    };

    router.push(buildListingsHref(newParams));
  };

  return (
    <div className="mb-6 px-6 py-4 justify-between flex">
      <div>
        
        {listingType === "hall" && (
          <>
          <h2 className="text-lg font-extrabold tracking-[-0.02em] text-text-primary">Venues in {locationLabel}</h2>
          <p className="mt-1 text-tiny text-[#555B7F]"> {count} {count === 1 ? "premium space" : "premium spaces"} found for your event</p>
          </>
        )}
        {listingType === "service" && (
          <>
          <h2 className="text-lg font-extrabold tracking-[-0.02em] text-text-primary">Services in {locationLabel}</h2>
          <p className="mt-1 text-tiny text-[#555B7F]"> {count} {count === 1 ? "premium service" : "premium services"} found for your event</p>
          </>
        )}
        
      </div>
      <div className="flex items-center justify-between">
        <SortDropdown 
          currentSort={params.sort} 
          currentSortOrder={params.sortOrder} 
          onSort={handleSort} 
        />
      </div>
    </div>
  );
}

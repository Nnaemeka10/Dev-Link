"use client";

import { useState } from "react"; //
import { useRouter, useSearchParams } from "next/navigation"; //
import { SlidersHorizontal } from "lucide-react";
import DesktopSearchBar from "@/features/search/components/DesktopSearchBar";
import FilterModal from "@/features/listings/components/FilterModal";
import { SortDropdown } from "@/features/listings/components/explore/SortDropdown";

import { buildListingsHref, normalizeListingSearchParams } from "@/features/listings/searchParams";

import type { FilterState } from "@/features/listings/components/FilterModal";
import type { SortBy, SortOrder } from "@/features/listings/searchParams";
import { SearchFormData } from "@/features/search/utils/searchSchema";
import { useSearchForm } from "@/features/search";

interface DesktopExploreHeaderProps {
  handleSearch: (data: SearchFormData) => void;
  form: ReturnType<typeof useSearchForm>;
  isPending: boolean;
  filter?: boolean; // Optional prop to conditionally show filter button
}

export function DesktopExploreHeader({ handleSearch, form, isPending, filter }: DesktopExploreHeaderProps) {
  
  
  const [isFilterOpen, setIsFilterOpen] = useState(false); //


  

  const handleApplyFilters = (filters: FilterState) => {
    // Handle filter application - can update search params or trigger filtering
    console.log("Filters applied:", filters);
  };

  return (
    <>
      <header className="border-b border-[#EDE4D8] bg-bg-primary flex-shrink-0">
        <div className="flex items-center gap-8 px-8 py-6 max-w-full">
          <DesktopSearchBar form={form} onSubmit={handleSearch} isPending={isPending} showShadow={true} />

          {filter && (
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#FFDFA7] px-6 py-3 text-sm font-extrabold hover:brightness-95 transition-all flex-shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          )}
        </div>
      </header>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApplyFilters={handleApplyFilters} />
    </>
  );
}

































export function DesktopResultsHeader() {
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
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h2 className="text-[2rem] font-extrabold tracking-[-0.02em]">Venues in Lagos</h2>
        <p className="mt-1 text-lg text-[#555B7F]">248 premium spaces found for your event</p>
      </div>
      <SortDropdown 
        currentSort={params.sort} 
        currentSortOrder={params.sortOrder} 
        onSort={handleSort} 
      />
    </div>
  );
}

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

  const [isFilterOpen, setIsFilterOpen] = useState(false);

   const handleApplyFilters = (filters: FilterState) => {
    // Handle filter application - can update search params or trigger filtering
    console.log("Filters applied:", filters);
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

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApplyFilters={handleApplyFilters} />
    </>
  );
}

export function MobileResultsHeader() {
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
    <div className="mb-6 px-6 py-4 space-y-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-text-primary">Venues in Lagos</h2>
        <p className="mt-1 text-sm text-[#555B7F]">248 spaces found for your event</p>
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

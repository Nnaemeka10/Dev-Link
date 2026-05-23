"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SortBy, SortOrder } from "@/features/listings/searchParams";

interface SortDropdownProps {
  currentSort?: SortBy;
  currentSortOrder?: SortOrder;
  onSort: (sort: SortBy, order: SortOrder) => void;
}

type SortOption = {
  label: string;
  sort: SortBy;
  order?: SortOrder;
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Recommended", sort: "recommended" },
  { label: "Price: Low to High", sort: "price", order: "asc" },
  { label: "Price: High to Low", sort: "price", order: "desc" },
  { label: "Rating: Low to High", sort: "rating", order: "asc" },
  { label: "Rating: High to Low", sort: "rating", order: "desc" },
];

export function SortDropdown({ currentSort, currentSortOrder, onSort }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCurrentLabel = (): string => {
    if (!currentSort || currentSort === "recommended") {
      return "Sort by: Recommended";
    }

    const option = SORT_OPTIONS.find((opt) => opt.sort === currentSort && opt.order === currentSortOrder);
    return option ? `Sort by: ${option.label}` : "Sort by: Recommended";
  };

  const handleSelectSort = (option: SortOption) => {
    const order: SortOrder = option.order || "asc";
    onSort(option.sort, order);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-extrabold text-[#A83A1C] hover:opacity-80 transition-opacity"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getCurrentLabel()}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-56 bg-white border border-[#E8DFD3] rounded-lg shadow-lg py-2 z-50"
          role="listbox"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected =
              option.sort === currentSort && (option.sort === "recommended" || option.order === currentSortOrder);

            return (
              <button
                key={`${option.sort}-${option.order || "default"}`}
                type="button"
                onClick={() => handleSelectSort(option)}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                  isSelected ? "bg-[#FFDFA7] text-[#333]" : "text-[#555B7F] hover:bg-[#F5F0E8]"
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {isSelected && <span className="text-[#A83A1C]">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}

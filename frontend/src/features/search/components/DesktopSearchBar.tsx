"use client";

import { useCallback } from "react";
import { Search } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { SEARCH_TABS } from "../lib/constants";
import type { SearchCategory } from "../types/search.types";
import type { SearchFormData } from "../utils/searchSchema";
import WhereCombobox from "./WhereCombobox";
import { CapacityDropdown } from "./CapacityDropdown";
import { RoleDropdown } from "./RoleDropdown";
import { DateRangePicker } from "./DateRange";

interface DesktopSearchBarProps {
  form: UseFormReturn<SearchFormData>;
  onSubmit: (data: SearchFormData) => void;
  isPending: boolean;
  showShadow?: boolean;
}

/** Category pill with a CSS-sliding indicator (replaces framer layoutId). */
function CategoryPill({ value, onChange }: { value: SearchCategory; onChange: (c: SearchCategory) => void }) {
  const index = SEARCH_TABS.findIndex((t) => t.id === value);
  return (
    <div
      role="tablist"
      aria-label="Search category"
      className="relative grid min-w-55 shrink-0 grid-cols-2 rounded-full bg-bg-primary p-1"
    >
      <span
        aria-hidden="true"
        className="cat-pill-indicator"
        style={{ transform: `translateX(${Math.max(index, 0) * 100}%)` }}
      />
      {SEARCH_TABS.map((tab) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 h-full rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-300 xl:px-4 xl:py-3 xl:text-sm ${
              isActive ? "text-text-primary" : "text-text-primary/55 hover:text-text-primary/80"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function DesktopSearchBar({ form, onSubmit, isPending, showShadow = true }: DesktopSearchBarProps) {
  const { handleSubmit, setValue, watch, formState: { errors } } = form;

  const category = watch("category");
  const location = watch("location") ?? "";         
  const coverageArea = watch("coverageArea") ?? "";  
  const capacity = watch("capacity");
  const role = watch("role");
  const dateRange = watch("dateRange");
  const flexible = watch("flexible");

  const handleCategoryChange = useCallback(
    (next: SearchCategory) => {
      setValue("category", next);
      // Clear the fields that don't apply to the new category.
      if (next === "halls") {
        setValue("role", undefined);
        setValue("coverageArea", "");
      } else {
        setValue("capacity", undefined);
        setValue("location", "");
      }
    },
    [setValue]
  );

  return (
    <div className="mx-auto hidden w-full max-w-5xl motion-safe:animate-fade-up [animation-delay:120ms] md:block">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className={`searchbar gap-2 xl:gap-3 ${showShadow ? "shadow-[0_10px_26px_rgba(26,31,60,0.12)]" : ""}`}
      >
        <CategoryPill value={category} onChange={handleCategoryChange} />

        <WhereCombobox
          mode={category === "halls" ? "location" : "coverage"}
          value={category === "halls" ? location : coverageArea}
          onChange={(v) => setValue(category === "halls" ? "location" : "coverageArea", v, { shouldValidate: v.length >= 2 })}
          error={category === "halls" ? errors.location?.message : errors.coverageArea?.message}
        />

        {category === "halls" ? (
          <CapacityDropdown value={capacity} onChange={(v) => setValue("capacity", v)} disabled={isPending} />
        ) : (
          <RoleDropdown value={role} onChange={(v) => setValue("role", v)} disabled={isPending} />
        )}

        <DateRangePicker
          value={dateRange}
          onChange={(range) => setValue("dateRange", range, { shouldValidate: true })}
          error={errors.dateRange?.from?.message ?? errors.dateRange?.message}
          flexible={flexible}
          onFlexibleChange={(v) => setValue("flexible", v)}
          showFlexible
        />

        <button
          type="submit"
          disabled={isPending}
          aria-label="Search"
          className="h-14 inline-flex shrink-0 items-center justify-center gap-2 self-center rounded-full bg-accent-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(214,92,58,0.35)] disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-70 xl:px-7 xl:py-3 xl:text-base"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent xl:h-5 xl:w-5" />
          ) : (
            <Search className="h-4 w-4 xl:h-5 xl:w-5" />
          )}
          Search
        </button>
      </form>
    </div>
  );
}
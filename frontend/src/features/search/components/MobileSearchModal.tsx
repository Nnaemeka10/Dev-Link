"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { SEARCH_TABS } from "../lib/constants";
import type { SearchFormData, SearchFormInput } from "../utils/searchSchema";
import { useSearchStore } from "../store/useSearchStore";
import WhereCombobox from "./WhereCombobox";
import { DateRangePicker } from "./DateRange";
import { CapacityDropdown } from "./CapacityDropdown";
import { RoleDropdown } from "./RoleDropdown";
import { SearchCategory } from "../types/search.types";

interface MobileSearchModalProps {
  form: UseFormReturn<SearchFormInput, any, SearchFormData>;   
  onSubmit: (data: SearchFormData) => void;
  isPending: boolean;
}

const FIELD_CARD =
  "rounded-3xl border border-text-primary/10 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(26,31,60,0.08)]";

export default function MobileSearchModal({ form, onSubmit, isPending }: MobileSearchModalProps) {
  const { control, handleSubmit, formState: { errors }, setValue, watch } = form;

  const category = watch("category");
  const flexible = watch("flexible");

  const isMobileSearchOpen = useSearchStore((s) => s.isMobileSearchOpen);
  const setIsMobileSearchOpen = useSearchStore((s) => s.setIsMobileSearchOpen);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  // Freeze the page behind the sheet - pure DOM mutation in an effect, no
  // setState, so it's rule-compliant. Restores the previous value on close.
  useEffect(() => {
    if (!isMobileSearchOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isMobileSearchOpen]);

  const handleCategoryChange = useCallback(
    (next: SearchCategory) => {
      setValue("category", next);
      if (next === "halls") {
        setValue("role", undefined);
        setValue("coverageArea", "", { shouldValidate: true });
      } else {
        setValue("capacity", undefined);
        setValue("location", "", { shouldValidate: true });
      }
    },
    [setValue]
  );

  if (!portalTarget) return null;

  return createPortal(
    isMobileSearchOpen && (
      <>
        <button
          type="button"
          aria-label="Close search"
          className="search-backdrop"
          onClick={() => setIsMobileSearchOpen(false)}
          
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          className="search-sheet fixed inset-0 z-50 flex flex-col overflow-hidden bg-white"
        >
          <div className="flex items-center justify-between border-b border-text-primary/10 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/40">Search</p>
              <h2 className="text-lg font-semibold text-text-primary">Begin your search</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-primary/10 text-text-primary/70 transition-colors hover:bg-bg-tertiary"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit((data) => {
              onSubmit(data);
              setIsMobileSearchOpen(false);
            })}
            className="flex flex-1 flex-col overflow-hidden"
            noValidate
          >
            <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6">
              {/* Category pill - the indicator slides via a CSS transform,
                  matching the desktop bar's segmented feel. */}
              <div className="relative grid grid-cols-2 rounded-full bg-bg-primary p-1">
                <span
                  aria-hidden
                  className="cat-pill-indicator"
                  style={{ transform: category === "halls" ? "translateX(0)" : "translateX(100%)" }}
                />
                {SEARCH_TABS.map((tab) => {
                  const isActive = tab.id === category;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleCategoryChange(tab.id)}
                      className={`relative z-10 rounded-full px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                        isActive ? "text-text-primary" : "text-text-primary/55"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Where (halls) / Coverage area (services) */}
              <div className={FIELD_CARD}>
                <Controller
                  name={category === "halls" ? "location" : "coverageArea"}
                  control={control}
                  render={({ field }) => (
                    <WhereCombobox
                      variant="modal"
                      mode={category === "halls" ? "location" : "coverage"}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={
                        category === "halls"
                          ? errors.location?.message
                          : errors.coverageArea?.message
                      }
                    />
                  )}
                />
              </div>

              {/* Capacity (halls) / Service role (services) - one card,
                  branching INSIDE the render so it always returns one element
                  (this is where RoleDropdown lives on mobile). */}
              <Controller
                name={category === "halls" ? "capacity" : "role"}
                control={control}
                render={({ field }) => (
                  <div className={FIELD_CARD}>
                    {category === "halls" ? (
                      <CapacityDropdown
                        variant="modal"
                        value={field.value as number | undefined}
                        onChange={field.onChange}
                        disabled={isPending}
                      />
                    ) : (
                      <RoleDropdown
                        variant="modal"
                        value={field.value as string | undefined}
                        onChange={field.onChange}
                        disabled={isPending}
                      />
                    )}
                  </div>
                )}
              />

              <div className="relative z-0 rounded-3xl border border-text-primary/10 bg-white px-2 py-1 shadow-[0_12px_30px_rgba(26,31,60,0.08)]">
                <Controller
                  name="dateRange"
                  control={control}
                  render={({ field }) => (
                    <DateRangePicker
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.dateRange?.from?.message ?? errors.dateRange?.message}
                      flexible={flexible}
                      onFlexibleChange={(v) => setValue("flexible", v)}
                      showFlexible
                    />
                  )}
                />
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-text-primary/10 bg-white/95 px-5 pb-6 pt-4 shadow-[0_-6px_18px_rgba(26,31,60,0.08)]">
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-4 text-base font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </button>
            </div>
          </form>
        </div>
      </>
    ),
    portalTarget
  );
}
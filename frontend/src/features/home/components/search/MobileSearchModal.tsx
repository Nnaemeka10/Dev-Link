"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building, MapPin, Search, User2, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Controller, UseFormReturn } from "react-hook-form";

import type { SearchFormData } from "../../utils/searchSchema";
import { useHomeStore } from "../../store/homeStore";
import { useLocationSuggestions } from "../../hooks/useHeroSearch";
import { DateRangePicker } from "../DateRange";
import { CapacityDropdown } from "./CapacityDropdown";
import { RoleDropdown } from "./RoleDropdown";

const TABS = [
  { id: "halls", label: "Event Halls" },
  { id: "services", label: "Services" },
] as const;

interface MobileSearchModalProps {
  form: UseFormReturn<SearchFormData>;
  onSubmit: (data: SearchFormData) => void;
  isPending: boolean;
}

/**
 * MobileSearchModal: Fullscreen mobile search modal
 *
 * Responsibilities:
 * - Render form UI with form validation via prop
 * - Read category/location/capacity/role from Zustand selectors
 * - Update Zustand on state changes
 * - Handle location suggestions
 * - Manage local UI state (showSuggestions)
 * - Handle focus trap and keyboard navigation
 * - Show/hide fields based on category
 */
export default function MobileSearchModal({
  form,
  onSubmit,
  isPending,
}: MobileSearchModalProps) {
  const { control, handleSubmit, formState: { errors }, setValue } = form;

  // Read from Zustand using selectors
  const category = useHomeStore((state) => state.category);
  const location = useHomeStore((state) => state.location);
  const capacity = useHomeStore((state) => state.capacity);
  const role = useHomeStore((state) => state.role);
  const isMobileSearchOpen = useHomeStore((state) => state.isMobileSearchOpen);
  const setCategory = useHomeStore((state) => state.setCategory);
  const setLocation = useHomeStore((state) => state.setLocation);
  const setCapacity = useHomeStore((state) => state.setCapacity);
  const setRole = useHomeStore((state) => state.setRole);
  const setIsMobileSearchOpen = useHomeStore((state) => state.setIsMobileSearchOpen);

  // Location autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: suggestions = [] } = useLocationSuggestions(location);
  const dialogRef = useRef<HTMLDivElement>(null);
  const portalTarget =
    typeof document !== "undefined" ? document.body : null;

  // Sync handlers: update both Zustand and form
  const handleLocationChange = useCallback(
    (value: string) => {
      setLocation(value);
      setValue("location", value, {
        shouldValidate: value.length >= 2,
      });
      setShowSuggestions(true);
    },
    [setLocation, setValue]
  );

  const handleCategoryChange = useCallback(
    (newCategory: "halls" | "services") => {
      setCategory(newCategory);
      setValue("category", newCategory);
      
      // Clear incompatible fields
      if (newCategory === "halls") {
        setRole(undefined);
        setValue("role", undefined);
      } else {
        setCapacity(undefined);
        setValue("capacity", undefined);
      }
    },
    [setCategory, setValue, setCapacity, setRole]
  );

  const handleCapacityChange = useCallback(
    (value: number | undefined) => {
      setCapacity(value);
      setValue("capacity", value);
    },
    [setCapacity, setValue]
  );

  const handleRoleChange = useCallback(
    (value: string | undefined) => {
      setRole(value);
      setValue("role", value);
    },
    [setRole, setValue]
  );

  const handleSuggestionSelect = useCallback(
    (name: string) => {
      setLocation(name);
      setValue("location", name, { shouldValidate: true });
      setShowSuggestions(false);
    },
    [setLocation, setValue]
  );

  const handleClearLocation = useCallback(() => {
    handleLocationChange("");
    setValue("location", "", { shouldValidate: false });
  }, [handleLocationChange, setValue]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSearchOpen]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isMobileSearchOpen) return;

    function getFocusableElements(container: HTMLElement | null) {
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((el) => !el.hasAttribute("disabled"));
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileSearchOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const items = getFocusableElements(dialogRef.current);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement as HTMLElement;

      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileSearchOpen, setIsMobileSearchOpen]);

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isMobileSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-text-primary/40"
            onClick={() => setIsMobileSearchOpen(false)}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            ref={dialogRef}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden"
            onKeyDown={(e) => e.key === "Escape" && setIsMobileSearchOpen(false)}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-text-primary/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/40">
                  Search
                </p>
                <h2 className="text-lg font-semibold text-text-primary">
                  Begin your search
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-text-primary/10 text-text-primary/70"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit((data) => {
                onSubmit(data);
                setIsMobileSearchOpen(false);
              })}
              className="flex flex-1 flex-col overflow-hidden"
              noValidate
            >
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
                {/* Category tabs */}
                <div className="rounded-full bg-bg-primary p-1">
                  <div className="grid grid-cols-2">
                    {TABS.map((tab) => {
                      const isActive = tab.id === category;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleCategoryChange(tab.id)}
                          className={`rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                            isActive
                              ? "bg-white text-text-primary shadow-[0_4px_12px_rgba(26,31,60,0.12)]"
                              : "text-text-primary/55"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location input with autocomplete - HALLS ONLY */}
                {category === "halls" && (
                  <div className="rounded-3xl border border-text-primary/10 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(26,31,60,0.08)]">
                    <div className="flex items-center gap-3">
                      <MapPin className="mt-1 h-5 w-5 text-text-primary/50" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                          Where
                        </p>
                        <Controller
                          name="location"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              autoComplete="off"
                              placeholder="Lagos, Abuja, PH..."
                              aria-label="Search location"
                              aria-invalid={!!errors.location}
                              aria-describedby={
                                errors.location
                                  ? "mobile-location-error"
                                  : undefined
                              }
                              className="mt-2 w-full bg-transparent text-base text-text-primary placeholder:text-text-primary/40 focus:outline-none"
                              onChange={(event) => {
                                field.onChange(event);
                                handleLocationChange(event.target.value);
                              }}
                              onFocus={() => setShowSuggestions(true)}
                              onBlur={() =>
                                setTimeout(() => setShowSuggestions(false), 150)
                              }
                            />
                          )}
                        />
                      </div>
                      {location && (
                        <button
                          type="button"
                          onClick={handleClearLocation}
                          className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-text-primary/5 text-text-primary/60"
                          aria-label="Clear location"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {errors.location && (
                      <p
                        id="mobile-location-error"
                        role="alert"
                        className="mt-2 text-xs text-red-500"
                      >
                        {errors.location.message}
                      </p>
                    )}

                    {/* Autocomplete suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="mt-4 space-y-2 rounded-2xl border border-text-primary/10 bg-bg-primary/40 p-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onMouseDown={() =>
                              handleSuggestionSelect(suggestion.name)
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-text-primary hover:bg-white"
                          >
                            <MapPin className="h-4 w-4 text-text-primary/45" />
                            <span>
                              {suggestion.name}
                              <span className="ml-1 text-text-primary/45">
                                {suggestion.state}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Capacity dropdown - HALLS ONLY */}
                {category === "halls" && (
                  <div className="rounded-3xl border border-text-primary/10 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(26,31,60,0.08)]">
                    <div className="flex items-center gap-3">
                        <Building className="mt-1 h-5 w-5 text-text-primary/50" />
                        <CapacityDropdown
                        value={capacity}
                        onChange={handleCapacityChange}
                        disabled={isPending}
                        />
                    </div>
                  </div>
                )}

                {/* Role dropdown - SERVICES ONLY */}
                {category === "services" && (
                  <div className="rounded-3xl border border-text-primary/10 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(26,31,60,0.08)]">
                    <div className="flex items-center gap-3">
                        <User2 className="mt-1 h-5 w-5 text-text-primary/50" />
                        <RoleDropdown
                        value={role}
                        onChange={handleRoleChange}
                        disabled={isPending}
                        />
                    </div>
                  </div>
                )}

                {/* Date picker */}
                <div className="rounded-3xl border border-text-primary/10 bg-white px-2 py-1 shadow-[0_12px_30px_rgba(26,31,60,0.08)] relative z-0">
                  <Controller
                    name="dateRange"
                    control={control}
                    render={({ field }) => (
                      <DateRangePicker
                        value={field.value}
                        onChange={field.onChange}
                        error={
                          errors.dateRange?.from?.message ??
                          errors.dateRange?.message
                        }
                      />
                    )}
                  />
                </div>
              </div>

              {/* Sticky search button */}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
}

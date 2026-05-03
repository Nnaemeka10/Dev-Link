"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, X } from "lucide-react";
import { useRef, useState, useCallback } from "react";
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

interface DesktopSearchBarProps {
  form: UseFormReturn<SearchFormData>;
  onSubmit: (data: SearchFormData) => void;
  isPending: boolean;
}

/**
 * DesktopSearchBar: Desktop-only search form
 *
 * Responsibilities:
 * - Render form UI with form validation via prop
 * - Read category/location/dateRange/capacity/role from Zustand selectors
 * - Update Zustand on state changes
 * - Handle location suggestions (debounced API call)
 * - Manage local UI state (showSuggestions)
 * - Show/hide fields based on category
 */
export default function DesktopSearchBar({
  form,
  onSubmit,
  isPending,
}: DesktopSearchBarProps) {
  const { control, handleSubmit, formState: { errors }, setValue } = form;

  // Read from Zustand using selectors
  const category = useHomeStore((state) => state.category);
  const location = useHomeStore((state) => state.location);
  const capacity = useHomeStore((state) => state.capacity);
  const role = useHomeStore((state) => state.role);
  const setCategory = useHomeStore((state) => state.setCategory);
  const setLocation = useHomeStore((state) => state.setLocation);
  const setCapacity = useHomeStore((state) => state.setCapacity);
  const setRole = useHomeStore((state) => state.setRole);

  // Location autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: suggestions = [] } = useLocationSuggestions(location);
  const locationRef = useRef<HTMLDivElement>(null);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 }}
      className="mx-auto w-full max-w-5xl hidden md:block"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex gap-4 rounded-[28px] bg-white p-2 shadow-[0_10px_26px_rgba(26,31,60,0.12)] overflow-visible"
      >
        {/* Category toggle pill */}
        <div className="relative flex min-w-55 items-center rounded-[28px] bg-bg-primary">
          {TABS.map((tab) => {
            const isActive = tab.id === category;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(tab.id)}
                className={`relative w-1/2 rounded-[28px] px-4 py-3 text-sm font-semibold transition-colors duration-300 h-full z-10 ${
                  isActive ? "text-text-primary" : "text-text-primary/55"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 50) handleCategoryChange("services");
                      if (info.offset.x < -50) handleCategoryChange("halls");
                    }}
                    className="absolute inset-0 bg-white shadow-[0_3px_8px_rgba(26,31,60,0.08)] rounded-[28px] cursor-grab active:cursor-grabbing"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-20 pointer-events-none">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Location input with autocomplete - HALLS ONLY */}
        {category === "halls" && (
          <div
            ref={locationRef}
            className="relative flex flex-1 items-center gap-3 border-l border-text-primary/10 px-5 py-3"
          >
            <MapPin className="h-5 w-5 shrink-0 text-text-primary/50" />
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary/45">
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
                    aria-describedby={errors.location ? "location-error" : undefined}
                    className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-primary/55 focus:outline-none"
                    onChange={(e) => {
                      field.onChange(e);
                      handleLocationChange(e.target.value);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 150)
                    }
                  />
                )}
              />
            </div>

            {/* Clear button */}
            {location && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="text-text-primary/40 hover:text-text-primary/70 transition-colors"
                aria-label="Clear location"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Validation error */}
            {errors.location && (
              <p
                id="location-error"
                role="alert"
                className="absolute -bottom-5 left-5 text-[11px] text-red-500"
              >
                {errors.location.message}
              </p>
            )}

            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  role="listbox"
                  aria-label="Location suggestions"
                  className="absolute left-0 top-full z-50 mt-2 w-full min-w-55 overflow-hidden rounded-2xl bg-white py-2 shadow-[0_8px_24px_rgba(26,31,60,0.14)]"
                >
                  {suggestions.map((s) => (
                    <li key={s.id} role="option" aria-selected={false}>
                      <button
                        type="button"
                        onMouseDown={() => handleSuggestionSelect(s.name)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-primary hover:bg-bg-primary transition-colors"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-text-primary/40" />
                        <span>
                          {s.name}
                          <span className="ml-1 text-text-primary/45">{s.state}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Capacity dropdown - HALLS ONLY */}
        {category === "halls" && (
          <CapacityDropdown
            value={capacity}
            onChange={handleCapacityChange}
            disabled={isPending}
          />
        )}

        {/* Role dropdown - SERVICES ONLY */}
        {category === "services" && (
          <RoleDropdown
            value={role}
            onChange={handleRoleChange}
            disabled={isPending}
          />
        )}

        {/* Date picker */}
        <Controller
          name="dateRange"
          control={control}
          render={({ field }) => (
            <DateRangePicker
              value={field.value}
              onChange={field.onChange}
              error={errors.dateRange?.from?.message ?? errors.dateRange?.message}
            />
          )}
        />

        {/* Search button */}
        <button
          type="submit"
          disabled={isPending}
          aria-label="Search events"
          className="inline-flex items-center justify-center gap-2 rounded-4xl bg-accent-primary px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 disabled:scale-100"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </button>
      </form>
    </motion.div>
  );
}

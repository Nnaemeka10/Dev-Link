"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { searchSchema, type SearchFormData } from "../utils/searchSchema";
import { useLocationSuggestions } from "../hooks/useHeroSearch";
import { DateRangePicker } from "./DateRange";
import MobileSearchModal from "./mobile/MobileSearchModal";
import { buildListingsHref } from "@/features/listings/searchParams";

const TABS = [
  { id: "halls", label: "Event Halls" },
  { id: "services", label: "Services" },
] as const;

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export default function HeroSection() {
  const router = useRouter();
  const [herotoggle, setHerotoggle] = useState<"halls" | "services">("halls");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  //location suggestion dropdown
  const [locationRaw, setLocationRaw] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  //usetransition for non-blocking results render
  const [isPending, startTransition] = useTransition();

  //react hook form for validation and state management
  const { control, handleSubmit, setValue, formState: { errors }, } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      category: "halls",
      location: "",
      dateRange: undefined,
    },
  });
  const selectedDateRange = useWatch({ control, name: "dateRange" });
  const selectedLocation = useWatch({ control, name: "location" });

  //location autocomplete
  const { data: suggestions = [] } = useLocationSuggestions(locationRaw);

  //handlers
  function handleTabChange(id: "halls" | "services") {
    setHerotoggle(id);
    setValue("category", id);
  }

  function handleLocationChange(value: string) {
    setLocationRaw(value);
    setValue("location", value, { shouldValidate: value.length >= 2 }); // only trigger validation (and thus suggestions) after 2 chars
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(name: string) {
    setLocationRaw(name);
    setValue("location", name, { shouldValidate: true });
    setShowSuggestions(false);
  }

  function onSubmit(data: SearchFormData) {
    startTransition(() => {
      router.push(
        buildListingsHref({
          category: data.category,
          location: data.location || undefined,
          dateFrom: data.dateRange?.from?.toISOString(),
          dateTo: data.dateRange?.to?.toISOString(),
        })
      );
    });
  }

  const mobileDateLabel = (() => {
    if (!selectedDateRange?.from) {
      return "";
    }

    if (!selectedDateRange.to) {
      return formatDateLabel(selectedDateRange.from);
    }

    return `${formatDateLabel(selectedDateRange.from)} - ${formatDateLabel(selectedDateRange.to)}`;
  })();

  const mobileSummaryLines = [
    selectedLocation?.trim() || "",
    mobileDateLabel,
  ].filter(Boolean);

  return (
    <section className="home-hero-shell min-h-72">
      {/* ── Animated spotlights — isolated so hero art can clip without clipping popovers ── */}
      <div aria-hidden="true" className="hero-spotlight-layer">
        <div className="hero-spotlight hero-spotlight--gold" />
        <div className="hero-spotlight hero-spotlight--ember" />
      </div>

      <div className="relative z-10 px-4 pb-8 pt-20 md:px-8 md:pb-40 md:pt-40">

        <div className="flex flex-col-reverse md:flex-col gap-16 ">
          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-text-primary md:text-7xl"
          >
            Curating Nigeria{"'"}s <span className="text-accent-primary">Finest Events</span>
          </motion.h1>

          {/* search bar */}
          {/* ── Desktop search bar ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto w-full max-w-5xl hidden md:block"
          >
            {/* Wrap the whole bar in a <form> so Enter key works natively */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex gap-4 rounded-[28px] bg-white p-2 shadow-[0_10px_26px_rgba(26,31,60,0.12)]"
            >
            {/* ── Category toggle pill ──────────────────────────────────── */}
              <div className="relative flex min-w-55 items-center rounded-[28px] bg-bg-primary">
              {TABS.map((tab) => {
                const isActive = tab.id === herotoggle;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
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
                          if (info.offset.x > 50) handleTabChange("services");
                          if (info.offset.x < -50) handleTabChange("halls");
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
 
            {/* ── "Where" input with autocomplete ──────────────────────── */}
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
                        // Delay so clicks on suggestions register first
                        setTimeout(() => setShowSuggestions(false), 150)
                      }
                    />
                  )}
                />
              </div>
 
              {/* Clear button */}
              {locationRaw && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationRaw("");
                    setValue("location", "", { shouldValidate: false });
                  }}
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
 
            {/* ── Search button ─────────────────────────────────────────── */}
              <button
                type="submit"
                disabled={isPending}
                aria-label="Search events"
                className="inline-flex items-center justify-center gap-2 rounded-4xl bg-accent-primary px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 disabled:scale-100"
              >
              {isPending ? (
                // Minimal inline spinner — no extra dependency needed
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
              </button>
            </form>
          </motion.div>

          {/* Mobile search */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto w-full max-w-5xl md:hidden"
          >
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="flex w-full items-center gap-4 rounded-full bg-white px-5 py-4 text-left shadow-[0_10px_26px_rgba(26,31,60,0.12)]"
            >
              <Search className="h-5 w-5 text-text-primary/50" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text-primary/60">Begin your search</span>
                {mobileSummaryLines.length > 0 && (
                  <div className="mt-1 space-y-0.5 text-sm text-text-primary">
                    {mobileSummaryLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </button>
          </motion.div>

          <MobileSearchModal
            isOpen={isMobileSearchOpen}
            onClose={() => setIsMobileSearchOpen(false)}
            tabs={TABS}
            activeTab={herotoggle}
            onTabChange={handleTabChange}
            control={control}
            errors={errors}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            isPending={isPending}
            locationRaw={locationRaw}
            onLocationChange={handleLocationChange}
            onSuggestionSelect={handleSuggestionSelect}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
          />
          
        </div>
      </div>
    </section>
  );
}

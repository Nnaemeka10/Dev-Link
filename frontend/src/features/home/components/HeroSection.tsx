"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, X } from "lucide-react";
import mobileHero from "@/assets/home/mobilehero.png";
import { useState, useRef, startTransition, useTransition} from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { searchSchema, type SearchFormData } from "../utils/searchSchema";
import { useLocationSuggestions, useSearch } from "../hooks/useHeroSearch";
import { DateRangePicker } from "./DateRange";

const TABS = [
  { id: "halls", label: "Event Halls" },
  { id: "services", label: "Services" },
] as const;




export default function HeroSection() {
  const [herotoggle, setHerotoggle] = useState<"halls" | "services">("halls"); 

  //search submit gate - incrementing tells react query to re-run eve if params didnt change
  const [searchKey, setSearchKey] = useState(0);

  //location suggestion dropdown
  const [locationRaw, setLocationRaw] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  //usetransition for non-blocking results render
  const [isPending, startTransition] = useTransition();

  //react hook form for validation and state management
  const { control, handleSubmit, setValue, watch, formState: { errors }, } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      category: "halls",
      location: "",
      dateRange: undefined,
    },
  });

  //keep categort insync with toggle state
  const currentLocation = watch("location");

  //location autocomplete
  const { data: suggestions = [] } = useLocationSuggestions(locationRaw);

  //search query - fires only after submit
  const searchParams = watch();

  const { data: searchResults, isFetching: isSearching } = useSearch(
    {
      category: herotoggle,
      location: searchParams.location,
      dateFrom: searchParams.dateRange?.from?.toISOString(),
      dateTo:   searchParams.dateRange?.to?.toISOString(),
    },
    searchKey
  );

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

  function onSubmit(_data: SearchFormData) {
    // Wrap the state update that triggers results rendering in startTransition
    // so the input stays snappy while React reconciles the results tree.
    startTransition(() => {
      setSearchKey((prev) => prev + 1);
    });
  }

  return (
    <section className="home-hero-shell border-b border-text-primary/5">
      {/* ── Animated spotlights — rendered first so they sit behind all content ── */}
      <div aria-hidden="true" className="hero-spotlight hero-spotlight--gold" />
      <div aria-hidden="true" className="hero-spotlight hero-spotlight--ember" />

      <div className="z-10 relative px-4 pb-8 pt-8 md:px-8 md:pb-40 md:pt-40">

        {/* headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-text-primary md:text-[72px]"
        >
          Curating Nigeria{"'"}s <span className="text-accent-primary">Finest Events</span>
        </motion.h1>


        {/* search bar */}
        {/* ── Desktop search bar ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mx-auto mt-8 hidden w-full max-w-5xl md:block"
        >
          {/* Wrap the whole bar in a <form> so Enter key works natively */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex rounded-[28px] bg-white p-2 shadow-[0_10px_26px_rgba(26,31,60,0.12)] gap-4"
          >
            {/* ── Category toggle pill ──────────────────────────────────── */}
            <div className="relative flex items-center rounded-[28px] bg-bg-primary min-w-55">
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
              disabled={isSearching || isPending}
              aria-label="Search events"
              className="inline-flex items-center justify-center gap-2 rounded-4xl bg-accent-primary px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isSearching || isPending ? (
                // Minimal inline spinner — no extra dependency needed
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>
          </form>
        </motion.div>
 
        {/* ── Mobile image preview (unchanged) ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
          className="mt-6 md:hidden"
        >
          <div className="mx-auto max-w-92.5 overflow-hidden rounded-[36px] bg-[#05070b] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
            <Image
              src={mobileHero}
              alt="eventvnv mobile planner preview"
              className="h-auto w-full rounded-[28px]"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

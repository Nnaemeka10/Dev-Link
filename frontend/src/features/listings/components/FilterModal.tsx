"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { X, Minus, Plus, Star, BadgeCheck, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocationSuggestions } from "@/features/search/hooks/useLocationSuggestions";
import { EVENT_HALL_TYPES, HALL_AMENITY_DEFINITIONS } from "@/features/createListing/data";

/**
 * Filter values are the wizard's stable ids, NOT display labels.
 *
 *   venueTypes - EVENT_HALL_TYPES ids - listing_hall_types.type_id
 *   amenities  - HALL_AMENITY_DEFINITIONS ids - listing_features.icon
 *                (resolved server-side by AMENITY_ICONS in Listing.ts)
 *
 * Importing the wizard's own arrays keeps one source of truth: what a vendor
 * picks in create-listing is exactly what a buyer can filter by. Hardcoding
 * labels here previously meant most pills matched nothing in the database.
 */
export interface FilterState {
  priceMin: number;
  priceMax: number;
  capacityMin: number;
  capacityMax: number;
  amenities: string[];
  venueTypes: string[];
  verified: boolean;
  minRating: number;
  coverageArea: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
  resultCount?: number;
  category: "halls" | "services";
}

/** Exported so the headers can omit unchanged bounds from the URL. */
export const PRICE_MIN_BOUND = 0;
export const PRICE_MAX_BOUND = 100_000_000;

const PRICE_STEP = 10_000;

const RATINGS = [
  { value: 0, label: "Any" },
  { value: 3.5, label: "3.5+" },
  { value: 4.0, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
  { value: 4.8, label: "4.8+" },
];

/** Full range by default, so "Clear all" genuinely clears the price filter. */
const DEFAULT_FILTERS: FilterState = {
  priceMin: PRICE_MIN_BOUND,
  priceMax: PRICE_MAX_BOUND,
  capacityMin: 0,
  capacityMax: 0,
  amenities: [],
  venueTypes: [],
  verified: false,
  minRating: 0,
  coverageArea: "",
};

const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40";

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

/**
 * Piecewise (non-linear) price scale, the Airbnb/Zillow technique.
 *   slider 0.00 - 0.75  maps to  ₦0 - ₦1,000,000          (dense zone)
 *   slider 0.75 - 1.00  maps to  ₦1,000,000 - ₦100,000,000 (sparse zone)
 * Both functions agree on the value at BREAKPOINT so handles never jump.
 */
const BREAKPOINT_VAL = 1_000_000;
const BREAKPOINT_POS = 0.75;

function valueToPos(value: number, min: number, max: number): number {
  if (value <= BREAKPOINT_VAL) {
    return ((value - min) / (BREAKPOINT_VAL - min)) * BREAKPOINT_POS;
  }
  return BREAKPOINT_POS + ((value - BREAKPOINT_VAL) / (max - BREAKPOINT_VAL)) * (1 - BREAKPOINT_POS);
}

function posToValue(pos: number, min: number, max: number): number {
  if (pos <= BREAKPOINT_POS) {
    return min + (pos / BREAKPOINT_POS) * (BREAKPOINT_VAL - min);
  }
  return BREAKPOINT_VAL + ((pos - BREAKPOINT_POS) / (1 - BREAKPOINT_POS)) * (max - BREAKPOINT_VAL);
}

//Coverage area autocomplete

function CoverageAreaInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [input, setInput] = useState(value);
  const [showSuggest, setShowSuggest] = useState(false);
  const { data: suggestions = [] } = useLocationSuggestions(input);

  useEffect(() => {
    setInput(value);
  }, [value]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-text-primary/15 bg-white px-4 py-3">
        <MapPin className="h-4 w-4 shrink-0 text-text-primary/40" aria-hidden="true" />
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            onChange(event.target.value);
            setShowSuggest(true);
          }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          placeholder="e.g. Lagos, Abuja"
          aria-label="Coverage area"
          className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-primary/40"
        />
        {input && (
          <button
            type="button"
            aria-label="Clear coverage area"
            onClick={() => {
              setInput("");
              onChange("");
            }}
            className="shrink-0 text-text-primary/40 transition-colors hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggest && suggestions.length > 0 && (
        <div className={`absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-text-primary/10 bg-white py-1 shadow-lg ${SCROLLBAR}`}>
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion.id}
              onMouseDown={() => {
                setInput(suggestion.name);
                onChange(suggestion.name);
                setShowSuggest(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-primary"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-text-primary/40" aria-hidden="true" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{suggestion.name}</span>
                <span className="text-tiny text-text-primary/45">
                  {suggestion.type === "state" ? "State" : `LGA in ${suggestion.state}`}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

//Dual range slider 

interface DualSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
}

function DualSlider({ min, max, valueMin, valueMax, onChange, step = PRICE_STEP }: DualSliderProps) {
  const rangeRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"min" | "max" | null>(null);

  // Latest-value ref: window listeners are attached ONCE per mount and read
  // through this ref, so a drag never clamps against a stale opposite bound
  // and listeners are never duplicated mid-drag.
  const latest = useRef({ min, max, valueMin, valueMax, step, onChange });
  latest.current = { min, max, valueMin, valueMax, step, onChange };

  const valueFromClientX = useCallback((clientX: number) => {
    const track = rangeRef.current;
    const s = latest.current;
    if (!track) return s.valueMin;
    const rect = track.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = posToValue(pos, s.min, s.max);
    return Math.max(s.min, Math.min(s.max, Math.round(raw / s.step) * s.step));
  }, []);

  const applyValue = useCallback((handle: "min" | "max", value: number) => {
    const s = latest.current;
    if (handle === "min") {
      s.onChange(Math.max(s.min, Math.min(value, s.valueMax - s.step)), s.valueMax);
    } else {
      s.onChange(s.valueMin, Math.min(s.max, Math.max(value, s.valueMin + s.step)));
    }
  }, []);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const handle = draggingRef.current;
      if (!handle) return;
      event.preventDefault();
      applyValue(handle, valueFromClientX(event.clientX));
    };
    const stopDrag = () => {
      draggingRef.current = null;
    };
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [applyValue, valueFromClientX]);

  // Clicking the track jumps the nearest handle to that spot and starts a drag.
  const handleTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const value = valueFromClientX(event.clientX);
    const s = latest.current;
    const handle = Math.abs(value - s.valueMin) <= Math.abs(value - s.valueMax) ? "min" : "max";
    draggingRef.current = handle;
    applyValue(handle, value);
  };

  const handleKeyDown =
    (handle: "min" | "max") => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      const s = latest.current;
      const current = handle === "min" ? s.valueMin : s.valueMax;
      let next: number | null = null;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = current - s.step;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next = current + s.step;
      if (event.key === "PageDown") next = current - s.step * 10;
      if (event.key === "PageUp") next = current + s.step * 10;
      if (event.key === "Home") next = handle === "min" ? s.min : s.valueMin + s.step;
      if (event.key === "End") next = handle === "max" ? s.max : s.valueMax - s.step;
      if (next !== null) {
        event.preventDefault();
        applyValue(handle, next);
      }
    };

  const toPct = (v: number) => valueToPos(Math.max(min, Math.min(max, v)), min, max) * 100;
  const leftPct = toPct(valueMin);
  const rightPct = toPct(Math.min(valueMax, max));

  const handleClass =
    "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-text-primary bg-white shadow-md transition-transform active:scale-110 active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary";

  return (
    <div className="px-1 pb-4 pt-2">
      <div
        ref={rangeRef}
        onPointerDown={handleTrackPointerDown}
        className="relative h-1 cursor-pointer rounded-full bg-text-primary/10"
      >
        {/* Breakpoint tick - visual hint that the scale changes here */}
        <div
          className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 rounded-full bg-text-primary/20"
          style={{ left: `${BREAKPOINT_POS * 100}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute h-full rounded-full bg-text-primary"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <button
          type="button"
          role="slider"
          aria-label="Minimum price"
          aria-valuemin={min}
          aria-valuemax={valueMax}
          aria-valuenow={valueMin}
          aria-valuetext={fmt(valueMin)}
          onPointerDown={(event) => {
            event.stopPropagation();
            draggingRef.current = "min";
            event.currentTarget.focus();
          }}
          onKeyDown={handleKeyDown("min")}
          className={handleClass}
          style={{ left: `${leftPct}%` }}
        />
        <button
          type="button"
          role="slider"
          aria-label="Maximum price"
          aria-valuemin={valueMin}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={fmt(valueMax)}
          onPointerDown={(event) => {
            event.stopPropagation();
            draggingRef.current = "max";
            event.currentTarget.focus();
          }}
          onKeyDown={handleKeyDown("max")}
          className={handleClass}
          style={{ left: `${rightPct}%` }}
        />
      </div>

      <div className="relative mt-3 flex select-none text-tiny font-medium text-text-primary/35">
        <span className="absolute left-0">₦0</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${BREAKPOINT_POS * 100}%` }}>
          ₦1M
        </span>
        <span className="absolute right-0">₦100M</span>
      </div>
    </div>
  );
}

//Stepper

interface StepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  zeroLabel?: string;
  onBlurValidate?: (committed: number) => void;
}

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  zeroLabel = "Any",
  onBlurValidate,
}: StepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value === 0 ? "" : String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const parsed = parseInt(draft, 10);
    const committed = Number.isNaN(parsed) ? value : Math.max(min, Math.min(max, parsed));
    if (!Number.isNaN(parsed)) onChange(committed);
    setEditing(false);
    onBlurValidate?.(committed);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") commitEdit();
    if (event.key === "Escape") setEditing(false);
  };

  const buttonClass =
    "flex h-8 w-8 items-center justify-center rounded-full border border-text-primary/20 text-text-primary transition-all hover:border-text-primary/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex items-center justify-between border-b border-text-primary/8 py-4 last:border-0">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => {
            setEditing(false);
            onChange(Math.max(min, value - 1));
          }}
          className={buttonClass}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={draft}
            min={min}
            max={max}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitEdit}
            onKeyDown={onKeyDown}
            aria-label={label}
            className="w-14 rounded-lg border border-text-primary/25 bg-white px-2 py-1 text-center text-sm font-semibold text-text-primary focus:border-text-primary/50 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            title="Click to type a value"
            className="w-14 text-center text-sm font-semibold text-text-primary underline decoration-text-primary/30 decoration-dotted underline-offset-2 transition-all hover:decoration-text-primary/60"
          >
            {value === 0 ? zeroLabel : value.toLocaleString()}
          </button>
        )}

        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => {
            setEditing(false);
            onChange(Math.min(max, value + 1));
          }}
          className={buttonClass}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

//  Pill & section 

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "select-none rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95",
        active
          ? "border-text-primary bg-text-primary text-white"
          : "border-text-primary/15 bg-white text-text-primary/80 hover:border-text-primary/35 hover:text-text-primary",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-text-primary/8 py-6 last:border-0">
      <h3 className="mb-4 text-base font-semibold text-text-primary">{title}</h3>
      {children}
    </div>
  );
}

function mergeFilters(initial?: Partial<FilterState>): FilterState {
  if (!initial) return { ...DEFAULT_FILTERS };
  const cleanInitial = Object.fromEntries(
    Object.entries(initial).filter(([, v]) => v !== undefined),
  ) as Partial<FilterState>;
  return { ...DEFAULT_FILTERS, ...cleanInitial };
}

//  Main modal 

/**
 * Applying filters calls onApplyFilters, the header rebuilds the listings URL
 * from these values (no cursor in it), the explore infinite query key changes,
 * every loaded page is discarded and page one is fetched under the new filter
 * set. Filters and cursor pagination can never disagree.
 */
export default function FilterModal({
  category,
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters,
  resultCount,
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(() => mergeFilters(initialFilters));
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Re-seed from the URL each time the sheet opens (sanctioned render-time
  // "previous prop" sync - no effect, no cascading render).
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setFilters(mergeFilters(initialFilters));
  }

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const togglePill = (key: "amenities" | "venueTypes", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleApply = () => {
    onApplyFilters({ ...filters, coverageArea: filters.coverageArea.trim() });
    onClose();
  };

  const handleReset = () => setFilters({ ...DEFAULT_FILTERS });

  const isHalls = category === "halls";

  const activeCount = [
    isHalls && filters.venueTypes.length > 0,
    isHalls && filters.amenities.length > 0,
    isHalls && (filters.capacityMin > 0 || filters.capacityMax > 0),
    !isHalls && filters.coverageArea.trim().length > 0,
    filters.verified,
    filters.minRating > 0,
    filters.priceMin > PRICE_MIN_BOUND || filters.priceMax < PRICE_MAX_BOUND,
  ].filter(Boolean).length;

  const scrollAreaClass = `min-h-0 flex-1 overflow-y-auto px-6 ${SCROLLBAR}`;

  const content = (
    <>
      <Section title="Price Range">
        <DualSlider
          min={PRICE_MIN_BOUND}
          max={PRICE_MAX_BOUND}
          valueMin={filters.priceMin}
          valueMax={Math.min(filters.priceMax, PRICE_MAX_BOUND)}
          onChange={(min, max) => setFilters((p) => ({ ...p, priceMin: min, priceMax: max }))}
        />
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl border border-text-primary/15 bg-white px-3 py-2.5">
            <label
              htmlFor="filter-price-min"
              className="text-tiny font-semibold uppercase tracking-widest text-text-primary/40"
            >
              Min
            </label>
            <input
              id="filter-price-min"
              type="number"
              value={filters.priceMin}
              min={PRICE_MIN_BOUND}
              max={PRICE_MAX_BOUND - PRICE_STEP}
              step={PRICE_STEP}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (!Number.isFinite(parsed)) return;
                const v = Math.max(PRICE_MIN_BOUND, Math.min(parsed, PRICE_MAX_BOUND - PRICE_STEP));
                setFilters((p) => ({ ...p, priceMin: v }));
              }}
              onBlur={() =>
                setFilters((p) =>
                  p.priceMin >= p.priceMax
                    ? { ...p, priceMax: Math.min(p.priceMin + PRICE_STEP, PRICE_MAX_BOUND) }
                    : p,
                )
              }
              className="mt-0.5 w-full bg-transparent text-sm font-semibold text-text-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center text-sm text-text-primary/30" aria-hidden="true">
            –
          </div>
          <div className="flex-1 rounded-xl border border-text-primary/15 bg-white px-3 py-2.5">
            <label
              htmlFor="filter-price-max"
              className="text-tiny font-semibold uppercase tracking-widest text-text-primary/40"
            >
              Max
            </label>
            <input
              id="filter-price-max"
              type="number"
              value={filters.priceMax}
              min={filters.priceMin + PRICE_STEP}
              max={PRICE_MAX_BOUND}
              step={PRICE_STEP}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (!Number.isFinite(parsed)) return;
                const v = Math.min(Math.max(parsed, PRICE_MIN_BOUND), PRICE_MAX_BOUND);
                setFilters((p) => ({ ...p, priceMax: v }));
              }}
              onBlur={() =>
                setFilters((p) =>
                  p.priceMax <= p.priceMin
                    ? { ...p, priceMin: Math.max(p.priceMax - PRICE_STEP, PRICE_MIN_BOUND) }
                    : p,
                )
              }
              className="mt-0.5 w-full bg-transparent text-sm font-semibold text-text-primary focus:outline-none"
            />
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-text-primary/45">
          {fmt(filters.priceMin)} –{" "}
          {filters.priceMax >= PRICE_MAX_BOUND ? `${fmt(PRICE_MAX_BOUND)}+` : fmt(filters.priceMax)}
        </p>
      </Section>

      {isHalls && (
        <>
          <Section title="Venue Type">
            <div className="flex flex-wrap gap-2">
              {EVENT_HALL_TYPES.map((type) => (
                <Pill
                  key={type.id}
                  label={type.label}
                  active={filters.venueTypes.includes(type.id)}
                  onClick={() => togglePill("venueTypes", type.id)}
                />
              ))}
            </div>
          </Section>

          <Section title="Guest Capacity">
            <Stepper
              label="Minimum guests"
              value={filters.capacityMin}
              onChange={(v) => setFilters((p) => ({ ...p, capacityMin: v }))}
              max={5000}
              onBlurValidate={(committed) =>
                setFilters((p) =>
                  p.capacityMax !== 0 && p.capacityMax <= committed
                    ? { ...p, capacityMax: committed + 1 }
                    : p,
                )
              }
            />
            <Stepper
              label="Maximum guests"
              value={filters.capacityMax}
              onChange={(v) => setFilters((p) => ({ ...p, capacityMax: v }))}
              max={5000}
              onBlurValidate={(committed) =>
                setFilters((p) =>
                  committed !== 0 && p.capacityMin >= committed
                    ? { ...p, capacityMin: Math.max(0, committed - 1) }
                    : p,
                )
              }
            />
          </Section>

          <Section title="Amenities">
            <div className="flex flex-wrap gap-2">
              {HALL_AMENITY_DEFINITIONS.map((amenity) => (
                <Pill
                  key={amenity.id}
                  label={amenity.label}
                  active={filters.amenities.includes(amenity.id)}
                  onClick={() => togglePill("amenities", amenity.id)}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-text-primary/45">
              Amenities stack - a venue must offer every one you pick.
            </p>
          </Section>
        </>
      )}

      {!isHalls && (
        <Section title="Coverage Area">
          <CoverageAreaInput
            value={filters.coverageArea}
            onChange={(val) => setFilters((p) => ({ ...p, coverageArea: val }))}
          />
          <p className="mt-2 text-xs text-text-primary/45">
            Search vendors by the states and local governments they cover.
          </p>
        </Section>
      )}

      <Section title="Minimum Rating">
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((rating) => (
            <button
              key={rating.value}
              type="button"
              aria-pressed={filters.minRating === rating.value}
              onClick={() => setFilters((p) => ({ ...p, minRating: rating.value }))}
              className={[
                "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95",
                filters.minRating === rating.value
                  ? "border-text-primary bg-text-primary text-white"
                  : "border-text-primary/15 bg-white text-text-primary/80 hover:border-text-primary/35",
              ].join(" ")}
            >
              {rating.value > 0 && <Star className="h-3 w-3 fill-current" aria-hidden="true" />}
              {rating.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={isHalls ? "Host" : "Provider"}>
        <button
          type="button"
          aria-pressed={filters.verified}
          onClick={() => setFilters((p) => ({ ...p, verified: !p.verified }))}
          className={[
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95",
            filters.verified
              ? "border-text-primary bg-text-primary text-white"
              : "border-text-primary/15 bg-white text-text-primary/80 hover:border-text-primary/35",
          ].join(" ")}
        >
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          {isHalls ? "Verified venues only" : "Verified vendors only"}
        </button>
      </Section>
    </>
  );

  const header = (
    <div className="flex shrink-0 items-center justify-between border-b border-text-primary/8 px-6 py-4">
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-text-primary/6"
        aria-label="Close filters"
      >
        <X className="h-4 w-4 text-text-primary" />
      </button>
      <h2 className="text-base font-bold text-text-primary">
        Filters
        {activeCount > 0 && (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-primary px-1 text-tiny font-bold text-white">
            {activeCount}
          </span>
        )}
      </h2>
      <button
        type="button"
        onClick={handleReset}
        className="text-sm font-semibold text-text-primary underline underline-offset-2 transition-colors hover:text-accent-primary"
      >
        Clear all
      </button>
    </div>
  );

  const footer = (
    <div className="shrink-0 border-t border-text-primary/8 px-6 py-4">
      <button
        type="button"
        onClick={handleApply}
        className="w-full rounded-xl bg-text-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-text-primary/85 active:scale-[0.99]"
      >
        {resultCount != null
          ? `Show ${resultCount.toLocaleString()} ${isHalls ? "venues" : "services"}`
          : "Apply filters"}
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Desktop: centered modal */}
          <motion.div
            key="filter-desktop"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center p-4 md:flex"
          >
            <div
              className="pointer-events-auto flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-bg-primary shadow-[0_24px_64px_rgba(26,31,60,0.22)]"
              onClick={(event) => event.stopPropagation()}
            >
              {header}
              <div className={scrollAreaClass}>{content}</div>
              {footer}
            </div>
          </motion.div>

          {/* Mobile: bottom sheet */}
          <motion.div
            key="filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-bg-primary shadow-[0_-8px_40px_rgba(26,31,60,0.18)] md:hidden"
            style={{ maxHeight: "92dvh" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-text-primary/15" />
            </div>
            {header}
            <div className={`${scrollAreaClass} pb-[env(safe-area-inset-bottom,0px)]`}>{content}</div>
            {footer}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Minus, Plus, Star, BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterState {
  priceMin: number;
  priceMax: number;
  capacityMin: number;
  capacityMax: number;
  parkingCapacity: number;     // 0 = Any; only active when "Parking" amenity is selected
  amenities: string[];
  accessibility: string[];
  verified: boolean;
  minRating: number;
  venueTypes: string[];
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  resultCount?: number;        // e.g. "Show 248 venues"
}

// ─── Static data ──────────────────────────────────────────────────────────────

const PRICE_MIN_BOUND = 0;
const PRICE_MAX_BOUND = 100_000_000;

const VENUE_TYPES = [
  "Banquet Hall", "Conference Room", "Cocktail Space", "Garden / Outdoor",
  "Boutique Hotel", "Loft / Studio", "Restaurant", "Rooftop",
];

// "Parking" is intentionally last — selecting it reveals the parking capacity stepper
const AMENITIES = [
  "WiFi", "Projector / Screen", "Sound System", "Air Conditioning",
  "Natural Lighting", "Catering Allowed", "Breakout Rooms",
  "Private Entrance", "Generator Backup", "CCTV / Security", "Parking",
];

const ACCESSIBILITY = [
  "Wheelchair Accessible", "Elevator Access", "Accessible Toilets",
  "Accessible Parking Bay", "Step-Free Entrance", "Hearing Loop",
];

const RATINGS = [
  { value: 0,   label: "Any"   },
  { value: 3.5, label: "3.5 +" },
  { value: 4.0, label: "4.0 +" },
  { value: 4.5, label: "4.5 +" },
  { value: 4.8, label: "4.8 +" },
];

const DEFAULT_FILTERS: FilterState = {
  priceMin:        50_000,
  priceMax:        500_000,
  capacityMin:     0,
  capacityMax:     0,
  parkingCapacity: 0,
  amenities:       [],
  accessibility:   [],
  verified:        false,
  minRating:       0,
  venueTypes:      [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

// ─── Dual range slider ────────────────────────────────────────────────────────

// ─── Piecewise scale (non-linear slider) ──────────────────────────────────────
//
// Problem: ₦0–₦1M is where 90%+ of bookings fall, but with a linear 0–100M
// scale it only occupies 1% of the slider width — nearly impossible to use.
//
// Solution: piecewise mapping, the same technique used by Airbnb / Zillow:
//
//   Slider position 0.00 → 0.75  maps to  ₦0       → ₦1,000,000   (dense zone)
//   Slider position 0.75 → 1.00  maps to  ₦1,000,000 → ₦100,000,000 (sparse zone)
//
// valueToPos:  price  → slider position [0,1]   (for rendering handle position)
// posToValue:  slider position [0,1] → price    (for converting pointer to price)
//
// The two segments are joined at the BREAKPOINT — both functions must agree
// on exactly what value lives at BREAKPOINT_POS so handles don't jump.

const BREAKPOINT_VAL = 1_000_000;   // ₦1M — the join point
const BREAKPOINT_POS = 0.75;        // 75% of slider width

function valueToPos(value: number, min: number, max: number): number {
  if (value <= BREAKPOINT_VAL) {
    // Dense segment: linear within [min, BREAKPOINT_VAL] → [0, BREAKPOINT_POS]
    return ((value - min) / (BREAKPOINT_VAL - min)) * BREAKPOINT_POS;
  } else {
    // Sparse segment: linear within [BREAKPOINT_VAL, max] → [BREAKPOINT_POS, 1]
    return (
      BREAKPOINT_POS +
      ((value - BREAKPOINT_VAL) / (max - BREAKPOINT_VAL)) *
        (1 - BREAKPOINT_POS)
    );
  }
}

function posToValue(pos: number, min: number, max: number): number {
  if (pos <= BREAKPOINT_POS) {
    return min + (pos / BREAKPOINT_POS) * (BREAKPOINT_VAL - min);
  } else {
    return (
      BREAKPOINT_VAL +
      ((pos - BREAKPOINT_POS) / (1 - BREAKPOINT_POS)) *
        (max - BREAKPOINT_VAL)
    );
  }
}

// ─── Dual range slider ────────────────────────────────────────────────────────

interface DualSliderProps {
  min: number; max: number;
  valueMin: number; valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
}

function DualSlider({ min, max, valueMin, valueMax, onChange, step = 10_000 }: DualSliderProps) {
  const rangeRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  // Convert a value to a % position on the slider track
  const toPct = (v: number) => valueToPos(Math.max(min, Math.min(max, v)), min, max) * 100;

  function getValueFromPointer(clientX: number): number {
    const rect  = rangeRef.current!.getBoundingClientRect();
    const pos   = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw   = posToValue(pos, min, max);
    // Snap to step, then clamp to [min, max]
    return Math.max(min, Math.min(max, Math.round(raw / step) * step));
  }

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return;
    const v = getValueFromPointer(e.clientX);
    if (dragging.current === "min") {
      onChange(Math.min(v, valueMax - step), valueMax);
    } else {
      onChange(valueMin, Math.max(v, valueMin + step));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMin, valueMax, step, onChange]);

  const onPointerUp = useCallback(() => {
    dragging.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup",   onPointerUp);
  }, [onPointerMove]);

  function startDrag(handle: "min" | "max") {
    dragging.current = handle;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup",   onPointerUp);
  }

  const leftPct  = toPct(valueMin);
  const rightPct = toPct(Math.min(valueMax, max));

  return (
    <div className="px-1 pt-2 pb-4">
      {/* Track */}
      <div ref={rangeRef} className="relative h-1 rounded-full bg-[#1a1f3c]/10">

        {/* Subtle breakpoint tick — visual hint that scale changes here */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2.5 w-px bg-[#1a1f3c]/20 rounded-full"
          style={{ left: `${BREAKPOINT_POS * 100}%` }}
          aria-hidden="true"
        />

        {/* Fill */}
        <div
          className="absolute h-full rounded-full bg-[#1a1f3c]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />

        {/* Min handle */}
        <button
          type="button"
          aria-label={`Minimum price ${fmt(valueMin)}`}
          aria-valuemin={min} aria-valuemax={valueMax} aria-valuenow={valueMin}
          role="slider"
          onPointerDown={() => startDrag("min")}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white border-2 border-[#1a1f3c] shadow-md cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[#d65c3a] focus-visible:outline-offset-2 touch-none"
          style={{ left: `${leftPct}%` }}
        />

        {/* Max handle */}
        <button
          type="button"
          aria-label={`Maximum price ${fmt(valueMax)}`}
          aria-valuemin={valueMin} aria-valuemax={max} aria-valuenow={valueMax}
          role="slider"
          onPointerDown={() => startDrag("max")}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white border-2 border-[#1a1f3c] shadow-md cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[#d65c3a] focus-visible:outline-offset-2 touch-none"
          style={{ left: `${rightPct}%` }}
        />
      </div>

      {/* Scale labels — anchored to breakpoint so user understands the split */}
      <div className="relative mt-3 flex text-[10px] text-[#1a1f3c]/35 font-medium select-none">
        <span className="absolute left-0">₦0</span>
        <span
          className="absolute -translate-x-1/2"
          style={{ left: `${BREAKPOINT_POS * 100}%` }}
        >
          ₦1M
        </span>
        <span className="absolute right-0">₦100M</span>
      </div>
    </div>
  );
}


// ─── Stepper ──────────────────────────────────────────────────────────────────
// Tapping the value label switches to an inline input for manual entry.
// Blur or Enter commits the value, clamped to [min, max].

interface StepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  zeroLabel?: string;
  // Called after blur commit with the committed value — use for cross-field nudging
  onBlurValidate?: (committed: number) => void;
}

function Stepper({ label, value, onChange, min = 0, max = 999, zeroLabel = "Any", onBlurValidate }: StepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(value === 0 ? "" : String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    const parsed = parseInt(draft, 10);
    const committed = !isNaN(parsed)
      ? Math.max(min, Math.min(max, parsed))
      : value; // blank input = keep current value
    if (!isNaN(parsed)) onChange(committed);
    setEditing(false);
    onBlurValidate?.(committed);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-[#1a1f3c]/8 last:border-0">
      <span className="text-sm font-medium text-[#1a1f3c]">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => { setEditing(false); onChange(Math.max(min, value - 1)); }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1a1f3c]/20 text-[#1a1f3c] transition-all hover:border-[#1a1f3c]/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        {/* Tappable value — switches to input on click */}
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={draft}
            min={min}
            max={max}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={onKeyDown}
            className="w-14 rounded-lg border border-[#1a1f3c]/25 bg-white px-2 py-1 text-center text-sm font-semibold text-[#1a1f3c] focus:outline-none focus:border-[#1a1f3c]/50"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            title="Click to type a value"
            className="w-14 text-center text-sm font-semibold text-[#1a1f3c] underline decoration-dotted underline-offset-2 decoration-[#1a1f3c]/30 hover:decoration-[#1a1f3c]/60 transition-all"
          >
            {value === 0 ? zeroLabel : value}
          </button>
        )}

        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => { setEditing(false); onChange(Math.min(max, value + 1)); }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1a1f3c]/20 text-[#1a1f3c] transition-all hover:border-[#1a1f3c]/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Pill toggle ──────────────────────────────────────────────────────────────

function Pill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 select-none",
        active
          ? "border-[#1a1f3c] bg-[#1a1f3c] text-white"
          : "border-[#1a1f3c]/15 bg-white text-[#1a1f3c]/80 hover:border-[#1a1f3c]/35 hover:text-[#1a1f3c]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-6 border-b border-[#1a1f3c]/8 last:border-0">
      <h3 className="mb-4 font-semibold text-base text-[#1a1f3c]">{title}</h3>
      {children}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function FilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  resultCount,
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function togglePill(key: "amenities" | "accessibility" | "venueTypes", value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }

  function handleApply() { onApplyFilters(filters); onClose(); }
  function handleReset()  { setFilters(DEFAULT_FILTERS); }

  const activeCount = [
    filters.venueTypes.length > 0,
    filters.amenities.length > 0,
    filters.accessibility.length > 0,
    filters.verified,
    filters.minRating > 0,
    filters.capacityMin > 0 || filters.capacityMax > 0,
    filters.parkingCapacity > 0,
    filters.priceMin !== DEFAULT_FILTERS.priceMin || filters.priceMax !== DEFAULT_FILTERS.priceMax,
  ].filter(Boolean).length;

  // ── Motion variants ──────────────────────────────────────────────────────────

  const overlayVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1 },
  };

  // Desktop: scale+fade in from center
  const desktopCardVariants = {
    hidden:  { opacity: 0, scale: 0.96, y: 8 },
    visible: { opacity: 1, scale: 1,    y: 0  },
  };

  // Mobile: slide up from bottom
  const sheetVariants = {
    hidden:  { y: "100%" },
    visible: { y: 0      },
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Shared scrollable content — rendered inside both mobile sheet and desktop modal
  const content = (
    <>
      {/* ── Price Range ──────────────────────────────────────────────────── */}
      <Section title="Price Range">
        <DualSlider
          min={PRICE_MIN_BOUND}
          max={PRICE_MAX_BOUND}
          valueMin={filters.priceMin}
          valueMax={Math.min(filters.priceMax, PRICE_MAX_BOUND)}
          onChange={(min, max) => setFilters((p) => ({ ...p, priceMin: min, priceMax: max }))}
        />
        <div className="mt-4 flex gap-3">
          {/* Min input */}
          <div className="flex-1 rounded-xl border border-[#1a1f3c]/15 bg-white px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1a1f3c]/40">Min</p>
            <input
              type="number"
              value={filters.priceMin}
              min={PRICE_MIN_BOUND}
              max={PRICE_MAX_BOUND - 10_000}
              step={10_000}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), PRICE_MAX_BOUND - 10_000);
                setFilters((p) => ({ ...p, priceMin: v }));
              }}
              onBlur={() => {
                // If min >= max, nudge max to min + 10k (one step above)
                setFilters((p) =>
                  p.priceMin >= p.priceMax
                    ? { ...p, priceMax: Math.min(p.priceMin + 10_000, PRICE_MAX_BOUND) }
                    : p
                );
              }}
              className="mt-0.5 w-full bg-transparent text-sm font-semibold text-[#1a1f3c] focus:outline-none"
            />
          </div>
          <div className="flex items-center text-[#1a1f3c]/30 text-sm">—</div>
          {/* Max input — clamped at 100M; values above silently floor to 100M */}
          <div className="flex-1 rounded-xl border border-[#1a1f3c]/15 bg-white px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1a1f3c]/40">Max</p>
            <input
              type="number"
              value={filters.priceMax}
              min={filters.priceMin + 10_000}
              max={PRICE_MAX_BOUND}
              step={10_000}
              onChange={(e) => {
                // Silently clamp — no error shown, slider just stays at 100M mark
                const v = Math.min(Number(e.target.value), PRICE_MAX_BOUND);
                setFilters((p) => ({ ...p, priceMax: v }));
              }}
              onBlur={() => {
                // If max <= min, nudge min to max - 10k (one step below)
                setFilters((p) =>
                  p.priceMax <= p.priceMin
                    ? { ...p, priceMin: Math.max(p.priceMax - 10_000, PRICE_MIN_BOUND) }
                    : p
                );
              }}
              className="mt-0.5 w-full bg-transparent text-sm font-semibold text-[#1a1f3c] focus:outline-none"
            />
          </div>
        </div>
        {/* Summary: if max > 100M, show "₦Xk – ₦100M+" to communicate the cap */}
        <p className="mt-2 text-xs text-[#1a1f3c]/45 text-center">
          {fmt(filters.priceMin)} –{" "}
          {filters.priceMax >= PRICE_MAX_BOUND
            ? `${fmt(PRICE_MAX_BOUND)}+`
            : fmt(filters.priceMax)}
        </p>
      </Section>

      {/* ── Venue Type ───────────────────────────────────────────────────── */}
      <Section title="Venue Type">
        <div className="flex flex-wrap gap-2">
          {VENUE_TYPES.map((t) => (
            <Pill
              key={t} label={t}
              active={filters.venueTypes.includes(t)}
              onClick={() => togglePill("venueTypes", t)}
            />
          ))}
        </div>
      </Section>

      {/* ── Guest Capacity ───────────────────────────────────────────────── */}
      <Section title="Guest Capacity">
        <Stepper
          label="Minimum guests"
          value={filters.capacityMin}
          onChange={(v) => setFilters((p) => ({ ...p, capacityMin: v }))}
          onBlurValidate={(committed) => {
            // If min was set and max is non-zero but less than or equal to min,
            // nudge max to min + 1. If max is 0 (Any), leave it — "Any" means
            // no upper bound, which is always valid against any min.
            setFilters((p) => {
              if (p.capacityMax !== 0 && p.capacityMax <= committed) {
                return { ...p, capacityMax: committed + 1 };
              }
              return p;
            });
          }}
        />
        <Stepper
          label="Maximum guests"
          value={filters.capacityMax}
          onChange={(v) => setFilters((p) => ({ ...p, capacityMax: v }))}
          max={5000}
          onBlurValidate={(committed) => {
            // If max was set and is less than or equal to min, nudge min to max - 1.
            // But if min would go below 0, just set min to 0 (Any).
            setFilters((p) => {
              if (committed !== 0 && p.capacityMin >= committed) {
                return { ...p, capacityMin: Math.max(0, committed - 1) };
              }
              return p;
            });
          }}
        />
      </Section>

      {/* ── Amenities (includes Parking pill at end) ──────────────────────── */}
      <Section title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <Pill
              key={a} label={a}
              active={filters.amenities.includes(a)}
              onClick={() => {
                togglePill("amenities", a);
                // If deselecting Parking, also reset parking capacity
                if (a === "Parking" && filters.amenities.includes("Parking")) {
                  setFilters((p) => ({ ...p, parkingCapacity: 0 }));
                }
              }}
            />
          ))}
        </div>

        {/* Conditional parking capacity stepper — only when Parking is selected */}
        <AnimatePresence>
          {filters.amenities.includes("Parking") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border border-[#1a1f3c]/10 bg-white px-4">
                <Stepper
                  label="Parking capacity (vehicles)"
                  value={filters.parkingCapacity}
                  onChange={(v) => setFilters((p) => ({ ...p, parkingCapacity: v }))}
                  max={500}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* ── Accessibility ────────────────────────────────────────────────── */}
      <Section title="Accessibility">
        <div className="flex flex-wrap gap-2">
          {ACCESSIBILITY.map((a) => (
            <Pill
              key={a} label={a}
              active={filters.accessibility.includes(a)}
              onClick={() => togglePill("accessibility", a)}
            />
          ))}
        </div>
      </Section>

      {/* ── Rating ───────────────────────────────────────────────────────── */}
      <Section title="Minimum Rating">
        <div className="flex gap-2 flex-wrap">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={filters.minRating === r.value}
              onClick={() => setFilters((p) => ({ ...p, minRating: r.value }))}
              className={[
                "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                filters.minRating === r.value
                  ? "border-[#1a1f3c] bg-[#1a1f3c] text-white"
                  : "border-[#1a1f3c]/15 bg-white text-[#1a1f3c]/80 hover:border-[#1a1f3c]/35",
              ].join(" ")}
            >
              {r.value > 0 && <Star className="h-3 w-3 fill-current" />}
              {r.label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Verified only ────────────────────────────────────────────────── */}
      <Section title="Host">
        <button
          type="button"
          aria-pressed={filters.verified}
          onClick={() => setFilters((p) => ({ ...p, verified: !p.verified }))}
          className={[
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
            filters.verified
              ? "border-[#1a1f3c] bg-[#1a1f3c] text-white"
              : "border-[#1a1f3c]/15 bg-white text-[#1a1f3c]/80 hover:border-[#1a1f3c]/35",
          ].join(" ")}
        >
          <BadgeCheck className="h-4 w-4" />
          Verified venues only
        </button>
      </Section>
    </>
  );

  // ── Shared header ─────────────────────────────────────────────────────────

  const header = (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1f3c]/8 shrink-0">
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#1a1f3c]/6 transition-colors"
        aria-label="Close filters"
      >
        <X className="h-4 w-4 text-[#1a1f3c]" />
      </button>
      <h2 className="text-base font-bold text-[#1a1f3c]">
        Filters
        {activeCount > 0 && (
          <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d65c3a] text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </h2>
      <button
        type="button"
        onClick={handleReset}
        className="text-sm font-semibold text-[#1a1f3c] underline underline-offset-2 hover:text-[#d65c3a] transition-colors"
      >
        Clear all
      </button>
    </div>
  );

  // ── Shared footer ─────────────────────────────────────────────────────────

  const footer = (
    <div className="px-6 py-4 border-t border-[#1a1f3c]/8 shrink-0">
      <button
        type="button"
        onClick={handleApply}
        className="w-full rounded-xl bg-[#1a1f3c] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#1a1f3c]/85 hover:scale-[1.01] active:scale-100"
      >
        {resultCount != null ? `Show ${resultCount.toLocaleString()} venues` : "Apply filters"}
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ───────────────────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* ── Desktop: centered modal ────────────────────────────────────── */}
          <motion.div
            key="desktop-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            variants={desktopCardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto flex flex-col w-full max-w-lg max-h-[88vh] rounded-2xl bg-[#f9f6ef] shadow-[0_24px_64px_rgba(26,31,60,0.22)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {header}
              <div className="flex-1 overflow-y-auto px-6 min-h-0 no-scrollbar">
                {content}
              </div>
              {footer}
            </div>
          </motion.div>

          {/* ── Mobile: bottom sheet ───────────────────────────────────────── */}
          <motion.div
            key="mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex flex-col rounded-t-3xl bg-[#f9f6ef] shadow-[0_-8px_40px_rgba(26,31,60,0.18)]"
            style={{ maxHeight: "92dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-[#1a1f3c]/15" />
            </div>
            {header}
            <div className="flex-1 overflow-y-auto px-6 min-h-0 no-scrollbar pb-[env(safe-area-inset-bottom,0px)]">
              {content}
            </div>
            {footer}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
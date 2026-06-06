"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DayPicker, type DateRange as DayPickerRange } from "react-day-picker";
import { ChevronLeft, ChevronRight, X, ChevronUp, Calendar } from "lucide-react";
import type { DateRange } from "@/features/search/utils/searchSchema"; // adjust path

// ─── Types ────────────────────────────────────────────────────────────────────

interface MobileBookingDockProps {
  price: string;           // e.g. "₦1,250,000"
  priceRaw: number;        // numeric for calculations e.g. 1250000
  booked: boolean;
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  onBook: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function formatShort(d: Date): string {
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round(Math.abs(b.getTime() - a.getTime()) / 86_400_000));
}

// ─── Inline calendar (no trigger button — just the DayPicker + footer) ────────

interface InlineCalendarProps {
  value: DayPickerRange | undefined;
  onChange: (r: DayPickerRange | undefined) => void;
  onApply: () => void;
  onClear: () => void;
}

function InlineCalendar({ value, onChange, onApply, onClear }: InlineCalendarProps) {
  const today = new Date(new Date().toDateString());

  return (
    <div className="px-4 pb-2">
      {/* Hint */}
      <p className="mb-3 text-center text-[11px] font-medium text-[#7B7E9B]">
        {!value?.from
          ? "Select a start date"
          : !value?.to
          ? "Select an end date — or tap again for a single day"
          : `${formatShort(value.from)} – ${formatShort(value.to)}`}
      </p>

      <DayPicker
        mode="range"
        selected={value}
        onSelect={onChange}
        numberOfMonths={1}
        disabled={{ before: today }}
        showOutsideDays={false}
        classNames={{
          root:           "rdp-root",
          months:         "rdp-months",
          month:          "rdp-month",
          month_caption:  "rdp-month-caption",
          caption_label:  "rdp-caption-label",
          nav:            "rdp-nav",
          button_previous:"rdp-nav-btn rdp-nav-btn--prev",
          button_next:    "rdp-nav-btn rdp-nav-btn--next",
          month_grid:     "rdp-grid",
          weekdays:       "rdp-weekdays",
          weekday:        "rdp-weekday",
          week:           "rdp-week",
          day:            "rdp-day",
          day_button:     "rdp-day-btn",
          today:          "rdp-day--today",
          outside:        "rdp-day--outside",
          disabled:       "rdp-day--disabled",
          range_start:    "rdp-day--range-start",
          range_end:      "rdp-day--range-end",
          range_middle:   "rdp-day--range-middle",
          selected:       "rdp-day--selected",
          hidden:         "rdp-day--hidden",
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left"
              ? <ChevronLeft className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />,
        }}
      />

      {/* Calendar footer */}
      <div className="mt-3 flex items-center justify-between border-t border-[#EFE8DE] pt-3">
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold text-[#252423] underline underline-offset-2"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={!value?.from}
          className="rounded-full bg-[#B9401D] px-5 py-2 text-sm font-extrabold text-white disabled:opacity-40"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ─── Price detail sheet ───────────────────────────────────────────────────────

interface PriceDetailSheetProps {
  priceRaw: number;
  price: string;
  dateRange: DateRange | undefined;
  onChangeDates: () => void;
  onClose: () => void;
  onBook: () => void;
  booked: boolean;
}

function PriceDetailSheet({
  priceRaw,
  price,
  dateRange,
  onChangeDates,
  onClose,
  onBook,
  booked,
}: PriceDetailSheetProps) {
  const days   = dateRange?.from && dateRange?.to
    ? daysBetween(dateRange.from, dateRange.to)
    : 1;
  const vat    = Math.round(priceRaw * days * 0.1);
  const total  = priceRaw * days + vat;

  return (
    <div className="flex flex-col">
      {/* Handle + header */}
      <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E8DDD2]" />
      </div>
      <div className="flex shrink-0 items-center justify-between px-5 pb-4">
        <h3 className="text-base font-extrabold text-[#252423]">Price details</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#252423]"
          aria-label="Close price details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Date range row with Change button */}
      <div className="mx-5 mb-5 flex items-center justify-between rounded-2xl border border-[#E8DDD2] bg-[#FAFAF8] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 shrink-0 text-[#B9401D]" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">
              Dates
            </p>
            <p className="text-sm font-semibold text-[#252423]">
              {dateRange?.from
                ? dateRange.to
                  ? `${formatShort(dateRange.from)} – ${formatShort(dateRange.to)}`
                  : formatShort(dateRange.from)
                : "No dates selected"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeDates}
          className="rounded-full border border-[#E8DDD2] bg-white px-3 py-1.5 text-xs font-extrabold text-[#252423] shadow-sm"
        >
          Change
        </button>
      </div>

      {/* Breakdown */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#5E6588] underline underline-offset-2">
            {price} × {days} {days === 1 ? "day" : "days"}
          </span>
          <strong className="text-[#252423]">{fmt(priceRaw * days)}</strong>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#5E6588] underline underline-offset-2">
            VAT (10%)
          </span>
          <strong className="text-[#252423]">{fmt(vat)}</strong>
        </div>
        <div className="flex items-center justify-between border-t border-[#EFE8DE] pt-4 text-base">
          <strong className="text-[#252423]">Total</strong>
          <strong className="text-[#252423]">{fmt(total)}</strong>
        </div>
      </div>

      {/* Book button */}
      <div className="shrink-0 px-5 pb-[env(safe-area-inset-bottom,1rem)] pt-4">
        <button
          type="button"
          onClick={onBook}
          className="w-full rounded-full bg-[#B9401D] py-4 text-sm font-extrabold text-white transition hover:brightness-95"
        >
          {booked ? "Booking Request Sent" : "Check Availability"}
        </button>
        <p className="mt-3 text-center text-[11px] font-semibold text-[#7B7E9B]">
          You won&apos;t be charged yet
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Sheet = "none" | "price" | "calendar";

export function MobileBookingDock({
  price,
  priceRaw,
  booked,
  dateRange,
  onDateChange,
  onBook,
}: MobileBookingDockProps) {
  const [sheet, setSheet] = useState<Sheet>("none");

  // Draft range lives here — only committed to parent on Apply
  const [draftRange, setDraftRange] = useState<DayPickerRange | undefined>(
    dateRange ? { from: dateRange.from, to: dateRange.to } : undefined
  );

  const days = dateRange?.from && dateRange?.to
    ? daysBetween(dateRange.from, dateRange.to)
    : null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openPrice    = () => setSheet("price");
  const openCalendar = () => setSheet("calendar");
  const closeSheet   = () => setSheet("none");

  const applyDates = useCallback(() => {
    onDateChange(
      draftRange?.from
        ? { from: draftRange.from, to: draftRange.to }
        : undefined
    );
    setSheet("price"); // go back to price sheet after applying
  }, [draftRange, onDateChange]);

  const clearDates = () => {
    setDraftRange(undefined);
    onDateChange(undefined);
  };

  // Sync draft when calendar opens
  const handleOpenCalendar = () => {
    setDraftRange(dateRange ? { from: dateRange.from, to: dateRange.to } : undefined);
    openCalendar();
  };

  // ── Spring variants ──────────────────────────────────────────────────────────

  const sheetVariants = {
    hidden:  { y: "100%" },
    visible: { y: 0 },
  };

  const sheetTransition = {
    type: "spring" as const,
    bounce: 0.18,
    duration: 0.42,
  };

  // ─── Portal guard ─────────────────────────────────────────────────────────

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      {/* ── Dock bar (always visible) ─────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-20 z-40 rounded-t-[2rem] border-t border-[#EFE8DE] bg-white px-5 py-4 shadow-[0_-8px_32px_rgba(36,28,18,0.10)]">
        <div className="flex items-center justify-between gap-4">

          {/* Price + duration — tappable, opens price detail sheet */}
          <button
            type="button"
            onClick={openPrice}
            className="flex flex-col items-start gap-0.5 text-left"
            aria-label="View price details"
          >
            <span className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#252423]">{price}</span>
              <span className="text-xs font-bold text-[#5E6588]">/ day</span>
            </span>
            {days ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#B9401D] underline underline-offset-2">
                {days} {days === 1 ? "day" : "days"}
                <ChevronUp className="h-3 w-3" />
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#9A9AAE]">Select dates</span>
            )}
          </button>

          {/* Book Now */}
          <button
            type="button"
            onClick={onBook}
            className="rounded-full bg-[#B9401D] px-9 py-4 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98]"
          >
            {booked ? "Booked" : "Book"}
          </button>
        </div>
      </div>

      {/* ── Sheets — portalled to body ───────────────────────────────────────── */}
      {portalTarget && createPortal(
        <AnimatePresence>
          {sheet !== "none" && (
            <>
              {/* Scrim */}
              <motion.div
                key="scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeSheet}
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
                aria-hidden="true"
              />

              {/* Sheet */}
              <motion.div
                key={sheet}
                role="dialog"
                aria-modal="true"
                aria-label={sheet === "price" ? "Price details" : "Select dates"}
                variants={sheetVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={sheetTransition}
                className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] bg-white shadow-[0_-8px_48px_rgba(36,28,18,0.18)]"
                style={{ maxHeight: "92dvh" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle
                <div className="flex justify-center pt-3 pb-1">
                  <div className="h-1 w-10 rounded-full bg-[#E8DDD2]" />
                </div> */}

                {/* ── Price detail sheet ──────────────────────────────────── */}
                {sheet === "price" && (
                  <PriceDetailSheet
                    priceRaw={priceRaw}
                    price={price}
                    dateRange={dateRange}
                    onChangeDates={handleOpenCalendar}
                    onClose={closeSheet}
                    onBook={onBook}
                    booked={booked}
                  />
                )}

                {/* ── Calendar sheet ──────────────────────────────────────── */}
                {sheet === "calendar" && (
                  <div className="flex flex-col">
                    {/* Calendar header */}
                    <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setSheet("price")}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#252423]"
                        aria-label="Back to price details"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-base font-extrabold text-[#252423]">Select dates</h3>
                      <button
                        type="button"
                        onClick={closeSheet}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#252423]"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Inline calendar — no trigger button, just the picker */}
                    <div className="overflow-y-auto pb-[env(safe-area-inset-bottom,1rem)]">
                      <InlineCalendar
                        value={draftRange}
                        onChange={setDraftRange}
                        onApply={applyDates}
                        onClear={clearDates}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        portalTarget
      )}
    </>
  );
}
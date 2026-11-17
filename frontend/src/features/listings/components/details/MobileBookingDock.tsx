"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronUp, X } from "lucide-react";
import type { DateRange } from "@/features/search/utils/searchSchema";
import SmartRangeCalendar from "@/features/search/components/SmartRangeCalender";
import { useListingAvailability } from "@/features/listings/hooks/useListingsAvailability";
import { usePricingQuote } from "@/features/bookings/hooks/usePricingQuote";
import {
  countSelectedDays,
  diffDays,
  envelope,
  excludedDates,
  finalizeRanges,
} from "@/features/search/utils/rangeSelection";

interface MobileBookingDockProps {
  listingId: string;
  /** Formatted daily rate, e.g. "₦1,250,000". */
  price: string;
  priceRaw: number;
  booked: boolean;
  /** Multi-range selection - same shape the booking wizard consumes. */
  dateRanges: DateRange[];
  onDateRangesChange: (ranges: DateRange[]) => void;
  onBook: () => void;
  packageId?: string;
  kind?: "hall" | "service";
  unavailableDates?: { from: string; to: string }[];
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const sheetVariants = { hidden: { y: "100%" }, visible: { y: 0 } };
const sheetTransition = { type: "spring" as const, bounce: 0.18, duration: 0.42 };

function fmt(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

function formatShort(d: Date): string {
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function spanLabel(range: { from: Date; to: Date }): string {
  return diffDays(range.from, range.to) === 0
    ? formatShort(range.from)
    : `${formatShort(range.from)} – ${formatShort(range.to)}`;
}

type Sheet = "none" | "price" | "calendar";

export function MobileBookingDock({
  listingId,
  price,
  priceRaw,
  booked,
  dateRanges,
  onDateRangesChange,
  onBook,
  packageId,
  kind = "hall",
  unavailableDates = [],
}: MobileBookingDockProps) {
  const [sheet, setSheet] = useState<Sheet>("none");
  const [draftRanges, setDraftRanges] = useState<DateRange[]>([]);

  const committed = useMemo(() => finalizeRanges(dateRanges), [dateRanges]);
  const hasDates = committed.length > 0;
  const dayCount = countSelectedDays(dateRanges);
  const range = envelope(dateRanges);
  const holes = excludedDates(dateRanges);

  const { data: quote, isLoading: quoteLoading } = usePricingQuote(
    listingId,
    range,
    packageId,
    holes
  );

  // Live greying: paid blocks + other customers' checkout holds, polled
  // every 15s while the calendar is open. Falls back to the listing's
  // static blocks until the first response lands.
  const { data: liveUnavailable, isFetching: availabilityFetching } =
    useListingAvailability(listingId, sheet === "calendar");
  const blocked = liveUnavailable ?? unavailableDates;

  const hireLabel = kind === "service" ? "Service fee" : "Venue hire";

  // Lock the page behind the sheet and allow Escape to dismiss.
  useEffect(() => {
    if (sheet === "none") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet("none");
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const openCalendar = useCallback(() => {
    setDraftRanges(dateRanges);
    setSheet("calendar");
  }, [dateRanges]);

  const applyDates = useCallback(() => {
    onDateRangesChange(finalizeRanges(draftRanges));
    setSheet("price");
  }, [draftRanges, onDateRangesChange]);

  const clearDates = useCallback(() => {
    setDraftRanges([]);
    onDateRangesChange([]);
  }, [onDateRangesChange]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const draftCount = countSelectedDays(draftRanges);

  return (
    <>
      {/*  Dock bar  */}
      <div className="fixed inset-x-0 bottom-20 z-40 border-t border-[#EFE8DE] bg-white/97 px-5 py-3.5 shadow-[0_-8px_32px_rgba(36,28,18,0.10)] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={hasDates ? () => setSheet("price") : openCalendar}
            className="flex min-w-0 flex-col items-start text-left"
            aria-label={hasDates ? "View price details" : "Select your dates"}
          >
            {hasDates && quote ? (
              <>
                <motion.span
                  key={quote.total}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="text-base font-extrabold text-[#252423]"
                >
                  {fmt(quote.total)}
                </motion.span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#B9401D] underline underline-offset-2">
                  {dayCount} {dayCount === 1 ? "day" : "days"} · incl. VAT
                  <ChevronUp className="h-3 w-3" aria-hidden="true" />
                </span>
              </>
            ) : (
              <>
                <span className="flex items-baseline gap-1">
                  <span className="text-base font-extrabold text-[#252423]">{price}</span>
                  <span className="text-xs font-bold text-[#5E6588]">/ day</span>
                </span>
                <span className="flex items-center gap-1 text-small font-bold text-[#B9401D] underline underline-offset-2">
                  {hasDates && quoteLoading ? "Calculating…" : "Select dates"}
                  <ChevronUp className="h-3 w-3" aria-hidden="true" />
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBook}
            className="shrink-0 rounded-full bg-[#B9401D] px-9 py-4 text-sm font-extrabold text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.98]"
          >
            {booked ? "Booked" : "Book"}
          </button>
        </div>
      </div>

      {/*  Sheets  */}
      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {sheet !== "none" && (
              <>
                <motion.div
                  key="scrim"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSheet("none")}
                  className="fixed inset-0 z-50 bg-[#1B140E]/40 backdrop-blur-[2px]"
                  aria-hidden="true"
                />
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
                  className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-4xl bg-white shadow-[0_-8px_48px_rgba(36,28,18,0.18)]"
                  style={{ maxHeight: "92dvh" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex shrink-0 justify-center pb-1 pt-3">
                    <div className="h-1 w-10 rounded-full bg-[#E8DDD2]" aria-hidden="true" />
                  </div>

                  {sheet === "price" ? (
                    <>
                      <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-2">
                        <h3 className="text-base font-extrabold text-[#252423]">
                          Price details
                        </h3>
                        <button
                          type="button"
                          onClick={() => setSheet("none")}
                          aria-label="Close price details"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#252423] transition-colors hover:bg-[#EDE8DE]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 [scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar]:w-1.5">
                        {/* Dates row */}
                        <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#E8DDD2] bg-[#FAFAF8] px-4 py-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <CalendarDays
                              className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]"
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p className="text-tiny font-extrabold uppercase tracking-widest text-[#9A9AAE]">
                                Dates
                              </p>
                              {hasDates ? (
                                <div className="mt-0.5 space-y-0.5">
                                  {committed.slice(0, 3).map((r, i) => (
                                    <p
                                      key={i}
                                      className="text-sm font-semibold text-[#252423]"
                                    >
                                      {spanLabel(r)}
                                    </p>
                                  ))}
                                  {committed.length > 3 && (
                                    <p className="text-xs font-bold text-[#9A9AAE]">
                                      +{committed.length - 3} more
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-0.5 text-sm font-semibold text-[#9A9AAE]">
                                  No dates selected
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={openCalendar}
                            className="shrink-0 rounded-full border border-[#E8DDD2] bg-white px-3 py-1.5 text-xs font-extrabold text-[#252423] shadow-sm transition-colors hover:bg-[#F7F2EA]"
                          >
                            {hasDates ? "Change" : "Select"}
                          </button>
                        </div>

                        {/* Breakdown */}
                        <div className="mt-4 space-y-3.5">
                          {!hasDates ? (
                            <div className="py-10 text-center">
                              <p className="text-sm font-bold text-[#252423]">
                                Select dates to calculate price
                              </p>
                              <p className="mx-auto mt-1 max-w-60 text-xs font-semibold text-[#9A9AAE]">
                                {fmt(priceRaw)} per day, plus 7.5% VAT. Removed days are
                                never charged.
                              </p>
                            </div>
                          ) : quoteLoading ? (
                            <div className="animate-pulse space-y-3.5">
                              <div className="h-4 w-3/4 rounded bg-[#EFE7DE]" />
                              <div className="h-4 w-1/2 rounded bg-[#EFE7DE]" />
                              <div className="h-7 w-full rounded bg-[#EFE7DE]" />
                            </div>
                          ) : quote ? (
                            <>
                              <div className="flex items-start justify-between gap-3 text-sm">
                                <span className="font-semibold text-[#5E6588] underline decoration-[#D8CDBF] underline-offset-2">
                                  {fmt(priceRaw)} × {quote.days}{" "}
                                  {quote.days === 1 ? "day" : "days"}
                                </span>
                                <strong className="shrink-0 text-[#252423]">
                                  {fmt(quote.subtotal)}
                                </strong>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-semibold text-[#5E6588]">
                                  VAT (7.5%)
                                </span>
                                <strong className="text-[#252423]">{fmt(quote.vat)}</strong>
                              </div>
                              {holes.length > 0 && (
                                <p className="rounded-xl bg-[#F1F7F2] px-3 py-2 text-xs font-bold text-[#2D5A27]">
                                  {holes.length} removed{" "}
                                  {holes.length === 1 ? "day isn't" : "days aren't"} charged
                                </p>
                              )}
                              <div className="flex items-end justify-between gap-3 border-t border-[#EFE8DE] pt-3.5">
                                <strong className="text-sm text-[#252423]">Total</strong>
                                <motion.strong
                                  key={quote.total}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.22, ease: EASE_OUT }}
                                  className="text-xl font-extrabold text-[#B9401D]"
                                >
                                  {fmt(quote.total)}
                                </motion.strong>
                              </div>
                            </>
                          ) : (
                            <p className="py-8 text-center text-sm font-semibold text-[#9A9AAE]">
                              We couldn&apos;t price these dates. Try selecting them again.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 border-t border-[#EFE8DE] px-5 pb-[env(safe-area-inset-bottom,1rem)] pt-4">
                        <button
                          type="button"
                          onClick={onBook}
                          className="w-full rounded-full bg-[#B9401D] py-4 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.98]"
                        >
                          {booked ? "Booked" : "Book"}
                        </button>
                        <p className="mt-3 text-center text-[11px] font-semibold text-[#7B7E9B]">
                          You won&apos;t be charged yet
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSheet("price")}
                          aria-label="Back to price details"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#252423] transition-colors hover:bg-[#EDE8DE]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <h3 className="text-base font-extrabold text-[#252423]">
                          Select dates
                        </h3>
                        <button
                          type="button"
                          onClick={() => setSheet("none")}
                          aria-label="Close calendar"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#252423] transition-colors hover:bg-[#EDE8DE]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Legend - makes the greyed-out days self-explanatory */}
                      <div className="flex shrink-0 flex-wrap items-center justify-center gap-4 px-5 pb-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#9A9AAE]">
                          <span className="h-3.5 w-3.5 rounded-full bg-[#B9401D]" />
                          Your dates
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#9A9AAE]">
                          <span className="h-3.5 w-3.5 rounded-full bg-[#E4DDD3]" />
                          Unavailable
                        </span>
                        {availabilityFetching && (
                          <span className="text-[11px] font-bold text-[#B9401D]">
                            Updating…
                          </span>
                        )}
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 [scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar]:w-1.5">
                        {/* Same engine as the booking step: blocked days can
                            never be selected or spanned, and tapping a selected
                            day removes it (split ranges). */}
                        <SmartRangeCalendar
                          ranges={draftRanges}
                          onChange={setDraftRanges}
                          blocked={blocked}
                          allowSplit
                          numberOfMonths={1}
                        />
                      </div>

                      <div className="shrink-0 border-t border-[#EFE8DE] px-5 pb-[env(safe-area-inset-bottom,1rem)] pt-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={clearDates}
                            className="rounded-full px-4 py-2.5 text-sm font-bold text-[#252423] underline underline-offset-2 transition-opacity hover:opacity-70"
                          >
                            Clear
                          </button>
                          <span className="text-xs font-bold text-[#9A9AAE]">
                            {draftCount} {draftCount === 1 ? "day" : "days"}
                          </span>
                          <button
                            type="button"
                            onClick={applyDates}
                            disabled={finalizeRanges(draftRanges).length === 0}
                            className="rounded-full bg-[#B9401D] px-7 py-3 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </>
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
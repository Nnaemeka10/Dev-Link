"use client";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { DateRange } from "@/features/search";
import { useListingAvailability } from "@/features/listings/hooks/useListingsAvailability";
import { FLEX_OPTIONS } from "../lib/constants";
import SmartRangeCalendar from "./SmartRangeCalender";
import {
  diffDays,
  finalizeRanges,
  startOfDay,
  type DayRange,
} from "../utils/rangeSelection";

//  Helpers 
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function formatTriggerLabel(range: DateRange | undefined): string {
  if (!range) return "";
  if (!range.to) return formatDate(range.from);
  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

/** "10 Dec - 14 Dec · 16 Dec - 20 Dec +1", at most two spans, then a count. */
function formatMultiLabel(ranges: DayRange[]): string {
  const done = finalizeRanges(ranges);
  if (done.length === 0) return "";
  const parts = done
    .map((r) =>
      diffDays(r.from, r.to) === 0 ? formatDate(r.from) : `${formatDate(r.from)} – ${formatDate(r.to)}`
    )
    .slice(0, 2);
  return parts.join(" · ") + (done.length > 2 ? ` +${done.length - 2}` : "");
}

//  Props 
interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  error?: string;
  variant?: "default" | "ghost";
  triggerClassName?: string;
  issearch?: boolean;
  unavailableDates?: { from: string; to: string }[];
  listingId?: string;
  /** Flexible dates (search only). */
  flexible?: number;
  onFlexibleChange?: (value: 0 | 1 | 2) => void;
  showFlexible?: boolean;
  multi?: boolean;
  ranges?: DayRange[];
  onRangesChange?: (ranges: DayRange[]) => void;
}

//  Component 
export function DateRangePicker({
  value,
  onChange,
  error,
  variant = "default",
  triggerClassName,
  issearch = true,
  unavailableDates = [],
  listingId,
  flexible = 0,
  onFlexibleChange,
  showFlexible = false,
  multi = false,
  ranges,
  onRangesChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Position updates run inside rAF/listener callbacks - lint-clean.
  const [popoverTop, setPopoverTop] = useState<number | null>(null);
  const [draftRanges, setDraftRanges] = useState<DayRange[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const isMobile = useMediaQuery("(max-width: 720px)");

  // Single source of truth for live availability (paid blocks + others' holds).
  // The hook polls every 15s and refetches on focus while the picker is open.
  const { data: liveUnavailableDates } = useListingAvailability(listingId, open);

  function openPicker() {
    const seed: DayRange[] = multi
      ? (ranges ?? [])
      : value
        ? [{ from: startOfDay(value.from), to: value.to ? startOfDay(value.to) : undefined }]
        : [];
    setDraftRanges(seed);
    setOpen(true);
  }

  const closePicker = useCallback(
    ({ apply }: { apply: boolean }) => {
      if (apply) {
        // Committing finalizes any pending start as a single-day range.
        const done = finalizeRanges(draftRanges);
        if (multi) {
          onRangesChange?.(done);
        } else {
          const r = done[0];
          onChange(r ? { from: r.from, to: r.to } : undefined);
        }
      }
      setOpen(false);
    },
    [draftRanges, multi, onRangesChange, onChange]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);
      if (!clickedTrigger && !clickedPopover) closePicker({ apply: true });
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closePicker, open]);

  // Position (rAF-first: no setState in effect body)
  useEffect(() => {
    if (!open) return;
    function updatePopoverPosition() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopoverTop(rect.bottom + 14);
    }
    const raf = requestAnimationFrame(updatePopoverPosition);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [open]);

  // Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePicker({ apply: false });
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [closePicker, open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleClear(e?: MouseEvent<HTMLButtonElement>) {
    e?.stopPropagation();
    if (open) {
      setDraftRanges([]);
      return;
    }
    if (multi) onRangesChange?.([]);
    else onChange(undefined);
  }

  const label = formatTriggerLabel(value);
  const singleDisplayLabel = label && flexible ? `${label} · ±${flexible}d` : label;
  const multiLabel = formatMultiLabel(multi ? (ranges ?? []) : []);
  const displayLabel = multi ? multiLabel : singleDisplayLabel;
  const hasSelection = multi ? finalizeRanges(ranges ?? []).length > 0 : !!value;

  //  Render 
  return (
    <div
      ref={containerRef}
      className={variant === "ghost" ? "flex flex-1" : issearch ? "date-picker-shell searchbar-segment" : "date-picker-shell"}
    >
      {variant === "ghost" ? (
        <button
          type="button"
          onClick={() => (open ? closePicker({ apply: false }) : openPicker())}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={triggerClassName || "w-full text-left text-sm"}
        >
          {displayLabel || "Select dates"}
        </button>
      ) : (
        <div className="flex w-full items-center">
          <button
            type="button"
            onClick={() => (open ? closePicker({ apply: false }) : openPicker())}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={displayLabel ? `Date: ${displayLabel}` : "Select date"}
            className="date-picker-trigger w-full md:gap-2 md:px-1 md:py-2 xl:gap-3 xl:py-3"
          >
            <CalendarDays className="date-picker-icon md:h-4 md:w-4 xl:h-5 xl:w-5" aria-hidden="true" />
            <div className="date-picker-trigger-text">
              <span className="date-picker-label md:text-[10px] xl:mb-[0.2rem] xl:text-[11px]">When</span>
              <span className={`date-picker-value md:text-xs xl:text-sm ${!displayLabel ? "date-picker-value--placeholder" : ""}`}>
                {displayLabel || "Add dates"}
              </span>
            </div>
          </button>

          {hasSelection && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear dates"
              className="date-picker-clear md:mr-2 md:h-4 md:w-4 xl:mr-2 xl:h-5 xl:w-5"
            >
              <X className="h-3.5 w-3.5 md:h-3 md:w-3 xl:h-3.5 xl:w-3.5" />
            </button>
          )}
        </div>
      )}

      {error && variant !== "ghost" && (
        <p role="alert" className="date-picker-error">
          {error}
        </p>
      )}

      {portalTarget
        ? createPortal(
            open && (
              <>
                <button
                  type="button"
                  aria-label="Close date picker"
                  className="date-picker-scrim"
                  onClick={() => closePicker({ apply: true })}
                />
                <div
                  ref={popoverRef}
                  role="dialog"
                  aria-label="Date picker"
                  aria-modal="true"
                  className="date-picker-popover search-popover relative"
                  style={popoverTop ? { top: popoverTop } : undefined}
                >
                  <button
                    type="button"
                    onClick={() => closePicker({ apply: false })}
                    aria-label="Close date picker"
                    className="absolute right-4 top-4 rounded-full p-1.5 text-[#555B7F] transition-colors hover:bg-black/5 xl:right-6 xl:top-6 xl:p-2"
                  >
                    <X className="h-4 w-4 xl:h-5 xl:w-5" />
                  </button>

                  {/* Hint + calendar live inside SmartRangeCalendar. Blocked
                      days can never be highlighted: the engine excludes them
                      from every span and clamps the hover preview. */}
                  <SmartRangeCalendar
                    ranges={draftRanges}
                    onChange={setDraftRanges}
                    blocked={liveUnavailableDates ?? unavailableDates}
                    allowSplit={multi}
                    numberOfMonths={isMobile ? 1 : 2}
                  />

                  {showFlexible && (
                    <div
                      className="date-picker-flexible"
                      role="radiogroup"
                      aria-label="Date flexibility"
                    >
                      {FLEX_OPTIONS.map((option) => {
                        const isActive = flexible === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => onFlexibleChange?.(option.value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isActive
                                ? "border-accent-primary bg-accent-primary text-white"
                                : "border-text-primary/15 text-text-primary/65 hover:border-accent-primary/50 hover:text-accent-primary"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="date-picker-footer">
                    <button type="button" onClick={handleClear} className="date-picker-footer-clear">
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => closePicker({ apply: true })}
                      className="date-picker-footer-apply"
                      disabled={finalizeRanges(draftRanges).length === 0}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            ),
            portalTarget
          )
        : null}
    </div>
  );
}
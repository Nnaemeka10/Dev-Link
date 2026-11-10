"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { DayPicker, type DateRange as DayPickerRange } from "react-day-picker";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { DateRange } from "@/features/search";
import { useListingAvailability } from "@/features/listings/hooks/useListingsAvailability";
import { FLEX_OPTIONS } from "../lib/constants";

//  Helpers 

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function formatTriggerLabel(range: DateRange | undefined): string {
  if (!range) return "";
  if (!range.to) return formatDate(range.from);
  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

// Props 

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
}

// Component 

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
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Position updates run inside rAF/listener callbacks , lint-clean.
  const [popoverTop, setPopoverTop] = useState<number | null>(null);
  const [draftRange, setDraftRange] = useState<DayPickerRange | undefined>(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const isMobile = useMediaQuery("(max-width: 720px)");

  function openPicker() {
    setDraftRange(value ? { from: value.from, to: value.to } : undefined);
    setOpen(true);
  }

  const closePicker = useCallback(
    ({ apply }: { apply: boolean }) => {
      if (apply) {
        onChange(draftRange?.from ? { from: draftRange.from, to: draftRange.to } : undefined);
      }
      setOpen(false);
    },
    [draftRange, onChange]
  );

  //Close on outside click 
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

  function handleSelect(range: DayPickerRange | undefined) {
    setDraftRange(range);
  }

  function handleClear(e?: MouseEvent<HTMLButtonElement>) {
    e?.stopPropagation();
    if (open) {
      setDraftRange(undefined);
      return;
    }
    onChange(undefined);
  }

  const label = formatTriggerLabel(value);
  const displayLabel = label && flexible ? `${label} · ±${flexible}d` : label;
  const today = new Date(new Date().toDateString());

  const { data: liveUnavailableDates } = useListingAvailability(listingId, open);

  const blockedRanges = useMemo(
    () =>
      (liveUnavailableDates ?? unavailableDates).map((d) => ({
        from: new Date(d.from + "T00:00:00"),
        to: new Date(d.to + "T00:00:00"),
      })),
    [liveUnavailableDates, unavailableDates]
  );

  // Render

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
          {displayLabel || "Select date"}
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

          {value && (
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

                  <p className="date-picker-hint">
                    {!draftRange?.from
                      ? "Select a start date"
                      : !draftRange?.to
                        ? "Select an end date, or click the same date for a single day"
                        : `${formatDate(draftRange.from)} – ${formatDate(draftRange.to)}`}
                  </p>

                  <DayPicker
                    mode="range"
                    selected={draftRange}
                    onSelect={handleSelect}
                    numberOfMonths={isMobile ? 1 : 2}
                    disabled={[{ before: today }, ...blockedRanges]}
                    showOutsideDays={false}
                    classNames={{
                      root: "rdp-root",
                      months: "rdp-months",
                      month: "rdp-month",
                      month_caption: "rdp-month-caption",
                      caption_label: "rdp-caption-label",
                      nav: "rdp-nav",
                      button_previous: "rdp-nav-btn rdp-nav-btn--prev",
                      button_next: "rdp-nav-btn rdp-nav-btn--next",
                      month_grid: "rdp-grid",
                      weekdays: "rdp-weekdays",
                      weekday: "rdp-weekday",
                      week: "rdp-week",
                      day: "rdp-day",
                      day_button: "rdp-day-btn",
                      today: "rdp-day--today",
                      outside: "rdp-day--outside",
                      disabled: "rdp-day--disabled",
                      range_start: "rdp-day--range-start",
                      range_end: "rdp-day--range-end",
                      range_middle: "rdp-day--range-middle",
                      selected: "rdp-day--selected",
                      hidden: "rdp-day--hidden",
                    }}
                    components={{
                      Chevron: ({ orientation }) =>
                        orientation === "left" ? (
                          <ChevronLeft className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        ),
                    }}
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
                      disabled={!draftRange}
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
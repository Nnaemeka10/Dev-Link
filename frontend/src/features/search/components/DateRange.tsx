"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { DayPicker, type DateRange as DayPickerRange } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { DateRange } from "@/features/search";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function formatTriggerLabel(range: DateRange | undefined): string {
  if (!range) return "";
  if (!range.to) return formatDate(range.from);
  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  error?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DateRangePicker({ value, onChange, error }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
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
        onChange(
          draftRange?.from
            ? { from: draftRange.from, to: draftRange.to }
            : undefined
        );
      }

      setOpen(false);
    },
    [draftRange, onChange]
  );

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);

      if (!clickedTrigger && !clickedPopover) {
        closePicker({ apply: true });
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closePicker, open]);

  useEffect(() => {
    if (!open) return;

    function updatePopoverPosition() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopoverTop(rect.bottom + 14);
    }

    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [open]);

  // ── Keyboard: close on Escape ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePicker({ apply: false });
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [closePicker, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // ── Handle day selection from react-day-picker ──────────────────────────────
  function handleSelect(range: DayPickerRange | undefined) {
    setDraftRange(range);
  }

  // ── Clear selection ─────────────────────────────────────────────────────────
  function handleClear(e?: MouseEvent<HTMLButtonElement>) {
    e?.stopPropagation();

    if (open) {
      setDraftRange(undefined);
      return;
    }

    onChange(undefined);
  }

  const label = formatTriggerLabel(value);
  const today = new Date(new Date().toDateString());

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="date-picker-shell">
      <div className={`date-picker-trigger-row ${open ? "date-picker-trigger-row--open" : ""}`}>
        {/* ── Trigger ────────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => (open ? closePicker({ apply: false }) : openPicker())}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={label ? `Date: ${label}` : "Select date"}
          className="date-picker-trigger"
        >
          <CalendarDays className="date-picker-icon" aria-hidden="true" />
          <div className="date-picker-trigger-text">
            <span className="date-picker-label">When</span>
            <span className={`date-picker-value ${!label ? "date-picker-value--placeholder" : ""}`}>
              {label || "Add dates"}
            </span>
          </div>
        </button>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear dates"
            className="date-picker-clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Validation error ──────────────────────────────────────────────────── */}
      {error && (
        <p role="alert" className="date-picker-error">
          {error}
        </p>
      )}

      {/* ── Popover ───────────────────────────────────────────────────────────── */}
      {portalTarget
        ? createPortal(
            <AnimatePresence>
              {open && (
                <>
                  <motion.button
                    type="button"
                    aria-label="Close date picker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="date-picker-scrim"
                    onClick={() => closePicker({ apply: true })}
                  />

                  <motion.div
                    ref={popoverRef}
                    role="dialog"
                    aria-label="Date picker"
                    aria-modal="true"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="date-picker-popover relative"
                    style={popoverTop ? { top: popoverTop } : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => closePicker({ apply: false })}
                      aria-label="Close date picker"
                      className="absolute right-6 top-6 p-2 rounded-full hover:bg-black/5 text-[#555B7F] transition-colors"
                    >
                      <X className="h-5 w-5" />
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
                      disabled={{ before: today }}
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

                    <div className="date-picker-footer">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="date-picker-footer-clear"
                      >
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
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            portalTarget
          )
        : null}
    </div>
  );
}

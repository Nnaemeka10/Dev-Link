"use client";

import { useRef, useState, useEffect } from "react";
import { DayPicker, type DateRange as DayPickerRange } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { DateRange } from "../utils/searchSchema"; // adjust path

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the in-progress selection separately so we can show hover states
  // before the user picks the second date
  const [selecting, setSelecting] = useState<DayPickerRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined
  );

  // Sync internal state when RHF resets the form
  useEffect(() => {
    setSelecting(value ? { from: value.from, to: value.to } : undefined);
  }, [value]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // ── Keyboard: close on Escape ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // ── Handle day selection from react-day-picker ──────────────────────────────
  function handleSelect(range: DayPickerRange | undefined) {
    setSelecting(range);

    if (!range) {
      onChange(undefined);
      return;
    }

    if (range.from) {
      // Commit to RHF — `to` may still be undefined (single date selected)
      onChange({ from: range.from, to: range.to });

      // If both dates are picked, close the popover
      if (range.from && range.to) {
        // Small delay so the user sees the selection snap before close
        setTimeout(() => setOpen(false), 160);
      }
    }
  }

  // ── Clear selection ─────────────────────────────────────────────────────────
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelecting(undefined);
    onChange(undefined);
  }

  const label = formatTriggerLabel(value);
  const today = new Date(new Date().toDateString());

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="date-picker-shell">

      {/* ── Trigger ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label ? `Date: ${label}` : "Select date"}
        className={`date-picker-trigger ${open ? "date-picker-trigger--open" : ""}`}
      >
        <CalendarDays className="date-picker-icon" aria-hidden="true" />
        <div className="date-picker-trigger-text">
          <span className="date-picker-label">When</span>
          <span className={`date-picker-value ${!label ? "date-picker-value--placeholder" : ""}`}>
            {label || "Add dates"}
          </span>
        </div>

        {/* Clear button — only when a date is selected */}
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
      </button>

      {/* ── Validation error ──────────────────────────────────────────────────── */}
      {error && (
        <p role="alert" className="date-picker-error">
          {error}
        </p>
      )}

      {/* ── Popover ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Date picker"
            aria-modal="true"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="date-picker-popover"
          >
            {/* Selection hint */}
            <p className="date-picker-hint">
              {!selecting?.from
                ? "Select a start date"
                : !selecting?.to
                ? "Select an end date, or click the same date for a single day"
                : `${formatDate(selecting.from)} – ${formatDate(selecting.to)}`}
            </p>

            <DayPicker
              mode="range"
              selected={selecting}
              onSelect={handleSelect}
              numberOfMonths={2}
              // Show two months on desktop, one on mobile (CSS handles hiding)
              // We render both always and use CSS to collapse to one on mobile
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
                // Custom nav chevrons using lucide to match your icon set
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ),
              }}
            />

            {/* Footer actions */}
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
                onClick={() => setOpen(false)}
                className="date-picker-footer-apply"
                disabled={!value}
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
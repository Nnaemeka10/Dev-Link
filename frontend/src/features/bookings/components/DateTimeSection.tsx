"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Timer } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { DateRangePicker } from "@/features/search/components/DateRange";
import type { DateRange } from "@/features/search/utils/searchSchema";
import { countSelectedDays } from "@/features/search/utils/rangeSelection";

const SLOT_MINUTES = 30;
const DAY_END = 23 * 60 + 30; // 23:30 - last selectable slot

/** "HH:MM" / "HH:MM:SS" - minutes past midnight, or null. */
function toMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Plain-language band so a 24-hour list still reads instantly. */
function band(minutes: number): string {
  if (minutes < 12 * 60) return "Morning";
  if (minutes < 17 * 60) return "Afternoon";
  if (minutes < 21 * 60) return "Evening";
  return "Night";
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} ${h === 1 ? "hr" : "hrs"}`;
  return `${h} ${h === 1 ? "hr" : "hrs"} ${m} mins`;
}

interface Preset {
  label: string;
  from: number;
  to: number;
}

const PRESETS: Preset[] = [
  { label: "Morning", from: 8 * 60, to: 12 * 60 },
  { label: "Afternoon", from: 12 * 60, to: 17 * 60 },
  { label: "Evening", from: 17 * 60, to: 22 * 60 },
];

interface DateTimeSectionProps {
  /** Disjoint completed ranges - the booking's source of truth. */
  dateRanges: DateRange[];
  startTime: string;
  endTime: string;
  unavailableDates?: { from: string; to: string }[];
  onDateRangesChange: (ranges: DateRange[]) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  listingId: string;
  /** Hall operating window. Null/invalid - full-day fallback. */
  availableFrom?: string | null;
  availableTo?: string | null;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">
      {children}
    </span>
  );
}

export function DateTimeSection({
  dateRanges,
  startTime,
  endTime,
  onDateRangesChange,
  onStartTimeChange,
  onEndTimeChange,
  unavailableDates = [],
  listingId,
  availableFrom,
  availableTo,
}: DateTimeSectionProps) {
  // Operating window, floored to a 30-minute boundary. A missing or reversed
  // window (some legacy rows) falls back to the full day rather than locking
  // the customer out of every time.
  const { windowFrom, windowTo, hasWindow } = useMemo(() => {
    const rawFrom = toMinutes(availableFrom);
    const rawTo = toMinutes(availableTo);
    if (rawFrom === null || rawTo === null || rawTo - rawFrom < 60) {
      return { windowFrom: 0, windowTo: DAY_END, hasWindow: false };
    }
    return {
      windowFrom: Math.ceil(rawFrom / SLOT_MINUTES) * SLOT_MINUTES,
      windowTo: Math.min(DAY_END, Math.floor(rawTo / SLOT_MINUTES) * SLOT_MINUTES),
      hasWindow: true,
    };
  }, [availableFrom, availableTo]);

  const startMinutes = toMinutes(startTime) ?? windowFrom;
  const endMinutes = toMinutes(endTime) ?? windowTo;
  const duration = endMinutes - startMinutes;
  const selectedDays = countSelectedDays(dateRanges);

  const startOptions = useMemo<DropdownOption[]>(() => {
    const options: DropdownOption[] = [];
    for (let m = windowFrom; m <= windowTo - SLOT_MINUTES; m += SLOT_MINUTES) {
      options.push({ value: toTime(m), label: toTime(m), description: band(m) });
    }
    return options;
  }, [windowFrom, windowTo]);

  const endOptions = useMemo<DropdownOption[]>(() => {
    const options: DropdownOption[] = [];
    const earliest = Math.max(startMinutes + SLOT_MINUTES, windowFrom + SLOT_MINUTES);
    for (let m = earliest; m <= windowTo; m += SLOT_MINUTES) {
      options.push({ value: toTime(m), label: toTime(m), description: band(m) });
    }
    return options;
  }, [startMinutes, windowFrom, windowTo]);

  /** Changing the start never leaves an end that is before it. */
  const handleStartChange = (value: string) => {
    const next = toMinutes(value);
    if (next === null) return;
    onStartTimeChange(value);
    if (endMinutes <= next) {
      const bumped = Math.min(next + 60, windowTo);
      onEndTimeChange(toTime(bumped > next ? bumped : windowTo));
    }
  };

  const handleEndChange = (value: string) => {
    const next = toMinutes(value);
    if (next === null || next <= startMinutes) return;
    onEndTimeChange(value);
  };

  const applyPreset = (preset: Preset) => {
    const from = Math.max(preset.from, windowFrom);
    const to = Math.min(preset.to, windowTo);
    if (to - from < 60) return;
    onStartTimeChange(toTime(from));
    onEndTimeChange(toTime(to));
  };

  const visiblePresets = PRESETS.filter(
    (p) => Math.min(p.to, windowTo) - Math.max(p.from, windowFrom) >= 60
  );
  const fullDayActive = startMinutes === windowFrom && endMinutes === windowTo;

  return (
    <div className="rounded-4xl bg-[#F4F1EA] p-6 md:p-8">
      <h3 className="font-man text-heading-m font-extrabold text-[#252423]">
        Select date &amp; time
      </h3>
      <p className="mt-1.5 text-tiny font-semibold text-[#7B7E9B] md:text-xs">
        Greyed-out dates are already booked or blocked by the vendor.
      </p>

      <div className="mt-6 space-y-5">
        {/* Event dates - multi-range: tap a selected day to remove it */}
        <div>
          <FieldLabel>Event dates</FieldLabel>
          <div className="mt-2.5 flex items-center gap-3 rounded-full bg-[#E8E4DC] px-5 py-3.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            <DateRangePicker
              multi
              ranges={dateRanges}
              onRangesChange={onDateRangesChange}
              // Single-range contract is unused in multi mode.
              value={undefined}
              onChange={() => {}}
              unavailableDates={unavailableDates}
              variant="ghost"
              triggerClassName="flex-1 bg-transparent md:text-sm text-small font-semibold text-[#252423] focus:outline-none text-left"
              listingId={listingId}
            />
          </div>
          {selectedDays > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 pl-1 text-tiny font-bold text-[#B9401D]"
            >
              {selectedDays} {selectedDays === 1 ? "day" : "days"} selected · you&apos;re charged
              only for the days you keep
            </motion.p>
          )}
        </div>

        {/* Quick presets - the fastest path to a sensible window */}
        {(visiblePresets.length > 0 || hasWindow) && (
          <div className="flex flex-wrap gap-2">
            {visiblePresets.map((preset) => {
              const from = Math.max(preset.from, windowFrom);
              const to = Math.min(preset.to, windowTo);
              const active = startMinutes === from && endMinutes === to;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-2 text-tiny font-extrabold transition-all active:scale-95 ${
                    active
                      ? "border-[#B9401D] bg-[#B9401D] text-white"
                      : "border-[#DED5C8] bg-white text-[#555B7F] hover:border-[#B9401D]/40"
                  }`}
                >
                  {preset.label}
                  <span className="ml-1.5 font-bold opacity-70">
                    {toTime(from)}–{toTime(to)}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                onStartTimeChange(toTime(windowFrom));
                onEndTimeChange(toTime(windowTo));
              }}
              aria-pressed={fullDayActive}
              className={`rounded-full border px-3.5 py-2 text-tiny font-extrabold transition-all active:scale-95 ${
                fullDayActive
                  ? "border-[#B9401D] bg-[#B9401D] text-white"
                  : "border-[#DED5C8] bg-white text-[#555B7F] hover:border-[#B9401D]/40"
              }`}
            >
              {hasWindow ? "All opening hours" : "Full day"}
            </button>
          </div>
        )}

        {/* Start / end - 24-hour clock, 30-minute steps.
            The Dropdown portals its popover to body, so the rounded
            container can never clip it. */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Start time</FieldLabel>
            <div className="mt-2.5 flex items-center gap-2 rounded-full bg-[#E8E4DC] px-4 py-3">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              <Dropdown
                aria-label="Start time (24-hour)"
                variant="ghost"
                size="sm"
                width="content"
                options={startOptions}
                value={toTime(startMinutes)}
                onChange={handleStartChange}
                triggerClassName="!p-0 font-extrabold text-[#252423]"
              />
            </div>
          </div>
          <div>
            <FieldLabel>End time</FieldLabel>
            <div className="mt-2.5 flex items-center gap-2 rounded-full bg-[#E8E4DC] px-4 py-3">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              <Dropdown
                aria-label="End time (24-hour)"
                variant="ghost"
                size="sm"
                width="content"
                options={endOptions}
                value={toTime(endMinutes)}
                onChange={handleEndChange}
                triggerClassName="!p-0 font-extrabold text-[#252423]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <motion.span
            key={duration}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-tiny font-extrabold text-[#252423] shadow-sm"
          >
            <Timer className="h-3.5 w-3.5 text-[#B9401D]" aria-hidden="true" />
            {formatDuration(duration)}
          </motion.span>
          <p className="text-tiny font-semibold text-[#7B7E9B]">
            {hasWindow
              ? `Venue hours ${toTime(windowFrom)} – ${toTime(windowTo)}`
              : "24-hour clock · West Africa Time (Lagos)"}
          </p>
        </div>
      </div>
    </div>
  );
}
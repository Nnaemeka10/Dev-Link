"use client";
import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays, applyDayClick, countSelectedDays, diffDays, parseDay,
  previewRange, toBlockedSet, type BlockedRanges, type DayRange,
} from "../utils/rangeSelection";

const CLASS_NAMES = {
  root: "rdp-root", months: "rdp-months", month: "rdp-month",
  month_caption: "rdp-month-caption", caption_label: "rdp-caption-label",
  nav: "rdp-nav", button_previous: "rdp-nav-btn rdp-nav-btn--prev",
  button_next: "rdp-nav-btn rdp-nav-btn--next", month_grid: "rdp-grid",
  weekdays: "rdp-weekdays", weekday: "rdp-weekday", week: "rdp-week",
  day: "rdp-day", day_button: "rdp-day-btn", today: "rdp-day--today",
  outside: "rdp-day--outside", disabled: "rdp-day--disabled", hidden: "rdp-day--hidden",
};

interface SmartRangeCalendarProps {
  ranges: DayRange[];
  onChange: (ranges: DayRange[]) => void;
  blocked?: BlockedRanges;
  /** false = single-range mode (search). true = split/merge mode (booking). */
  allowSplit?: boolean;
  numberOfMonths?: number;
}

export default function SmartRangeCalendar({
  ranges, onChange, blocked = [], allowSplit = true, numberOfMonths = 2,
}: SmartRangeCalendarProps) {
  const [hovered, setHovered] = useState<Date | null>(null);
  const blockedSet = useMemo(() => toBlockedSet(blocked), [blocked]);

  const disabled = useMemo(
    () => [
      { before: new Date(new Date().toDateString()) },
      ...blocked.map((r) => ({ from: parseDay(r.from), to: parseDay(r.to) })),
    ],
    [blocked],
  );

  // Custom modifier names (span_*) mapped onto your existing rdp CSS classes.
  const modifiers = useMemo(() => {
    const completed = ranges.filter((r): r is { from: Date; to: Date } => !!r.to);
    const open = ranges.find((r) => !r.to);
    const preview = open && hovered ? previewRange(open.from, hovered, blockedSet) : null;
    const spans = preview ? [...completed, preview] : completed;

    const start: Date[] = [], end: Date[] = [], middle: Date[] = [], single: Date[] = [];
    for (const s of spans) {
      if (diffDays(s.from, s.to) === 0) { single.push(s.from); continue; }
      start.push(s.from);
      end.push(s.to);
      for (let d = addDays(s.from, 1); d < s.to; d = addDays(d, 1)) middle.push(d);
    }
    if (open) single.push(open.from);

    const deselectHint =
      allowSplit && hovered && completed.some((r) => hovered > r.from && hovered < r.to)
        ? [hovered] : [];

    return {
      span_start: start, span_end: end, span_middle: middle,
      span_single: single, deselect_hint: deselectHint,
    };
  }, [ranges, hovered, blockedSet, allowSplit]);

  const open = ranges.find((r) => !r.to);
  const total = countSelectedDays(ranges);
  const hint = open
    ? "Pick an end date - unavailable dates can't be included"
    : total > 0
      ? allowSplit
        ? `${total} day${total === 1 ? "" : "s"} selected · tap a selected date to remove it`
        : "Tap any date to start a new selection"
      : "Select a start date";

  return (
    <>
      <p className="date-picker-hint">{hint}</p>
      <DayPicker
        numberOfMonths={numberOfMonths}
        disabled={disabled}
        showOutsideDays={false}
        onDayClick={(date, mods) => {
          if (!mods.disabled) onChange(applyDayClick(ranges, date, blockedSet, allowSplit));
        }}
        onDayMouseEnter={(date, mods) => { if (!mods.disabled) setHovered(date); }}
        onDayMouseLeave={() => setHovered(null)}
        modifiers={modifiers}
        modifiersClassNames={{
          span_start: "rdp-day--range-start",
          span_end: "rdp-day--range-end",
          span_middle: "rdp-day--range-middle",
          span_single: "rdp-day--selected",
          deselect_hint: "rdp-day--deselect-hint",
        }}
        classNames={CLASS_NAMES}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left"
              ? <ChevronLeft className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />,
        }}
      />
    </>
  );
}
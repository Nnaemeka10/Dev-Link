"use client";

import { CalendarDays, Clock, UsersRound, ChevronDown } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown"; 
import { DateRangePicker } from "@/features/search/components/DateRange";
import type { DateRange } from "@/features/search/utils/searchSchema";

// ─── Time options ─────────────────────────────────────────────────────────────

const START_TIMES: DropdownOption[] = [
  { value: "08:00", label: "08:00 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "20:00", label: "08:00 PM" },
];

const END_TIMES: DropdownOption[] = [
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "20:00", label: "08:00 PM" },
  { value: "21:00", label: "09:00 PM" },
  { value: "22:00", label: "10:00 PM" },
  { value: "23:00", label: "11:00 PM" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface DateTimeSectionProps {
  dateRange: DateRange | undefined;
  startTime: string;
  endTime: string;
  unavailableDates?: { from: string; to: string }[];
  onDateRangeChange: (range: DateRange | undefined) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  listingId: string;
}

// ─── Field wrapper — matches the pill shape in the screenshot ─────────────────

function FieldPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2.5 flex items-center gap-3 rounded-full bg-[#E8E4DC] px-5 py-3.5">
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">
      {children}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DateTimeSection({
  dateRange,
  startTime,
  endTime,
  onDateRangeChange,
  onStartTimeChange,
  onEndTimeChange,
  unavailableDates = [],
  listingId,
}: DateTimeSectionProps) {
  return (
    <div className="rounded-[2rem] bg-[#F4F1EA] p-6 md:p-8">
      <h3 className="mb-6 font-man text-xl font-extrabold text-[#252423]">
        Select Date &amp; Time
      </h3>

      <div className="space-y-5">

        {/* ── Event Date — full width ─────────────────────────────────────── */}
        <div>
          <FieldLabel>Event Date</FieldLabel>
          <FieldPill>
            <CalendarDays className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              unavailableDates={unavailableDates}
              variant="ghost"
              triggerClassName="flex-1 bg-transparent text-sm font-semibold text-[#252423] focus:outline-none text-left"
              listingId = {listingId}
            />
          </FieldPill>
        </div>

        {/* ── Start Time + End Time — side by side ────────────────────────── */}
        {/*
          We use the feature-agnostic Dropdown in a custom pill wrapper
          rather than the "cell" variant so we can match the pill shape.
          The Dropdown's popover portals to body so it won't be clipped
          by the rounded-[2rem] container.
        */}
        <div className="grid grid-cols-2 gap-3">

          {/* Start Time */}
          <div>
            <FieldLabel>Start Time</FieldLabel>
            <div className="mt-2.5 flex items-center gap-2 rounded-full bg-[#E8E4DC] px-4 py-3">
              <Clock className="sm-h-4 sm:w-4 h-2.5 w-2.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              {/*
                We render a minimal inline trigger here that wraps Dropdown
                so the clock icon sits outside the Dropdown's own trigger,
                matching the design exactly.
              */}
              <Dropdown
                aria-label="Start time"
                variant="ghost"
                size="sm"
                width="content"
                options={START_TIMES}
                value={startTime}
                onChange={onStartTimeChange}
                triggerClassName="!p-0 font-semibold text-[#252423] text-tiny lg:text-sm"
              />
            </div>
          </div>

          {/* End Time */}
          <div>
            <FieldLabel>End Time</FieldLabel>
            <div className="mt-2.5 flex items-center gap-2 rounded-full bg-[#E8E4DC] px-4 py-3">
              <Clock className="sm-h-4 sm:w-4 h-2.5 w-2.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              <Dropdown
                aria-label="End time"
                variant="ghost"
                size="sm"
                width="content"
                options={END_TIMES}
                value={endTime}
                onChange={onEndTimeChange}
                triggerClassName="!p-0 font-semibold text-[#252423]"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
"use client";

import { DayPicker, type Modifiers } from "react-day-picker";
import { useListingStore } from "../store/useListingStore";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AvailabilitySection() {
  const blockedDates = useListingStore((s) => s.form.pricing.availability.blockedDates);
  const toggleBlockedDate = useListingStore((s) => s.toggleBlockedDate);

  const today = new Date(new Date().toDateString());

  // Convert ISO strings (YYYY-MM-DD) to Date objects for react-day-picker
  const selectedDates = blockedDates.map((d) => new Date(d + "T00:00:00"));

  const handleSelect = (days: Date[] | undefined, triggerDate: Date, modifiers: Modifiers) => {
    // Ignore clicks on disabled days (past days)
    if (modifiers.disabled) return;
    
    // FIX: Use local time methods to prevent timezone shifts from UTC
    const year = triggerDate.getFullYear();
    const month = String(triggerDate.getMonth() + 1).padStart(2, '0');
    const day = String(triggerDate.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    
    toggleBlockedDate(isoDate);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 xs:flex-row xs:items-end xs:justify-between">
        <div>
          <h3 className="font-man text-xl font-bold text-text-primary">Manage Availability</h3>
          <p className="mt-1 max-w-xl text-sm text-text-primary/55">
            Block dates you&apos;re already booked or unavailable — clients won&apos;t be able to request those days.
          </p>
        </div>
        {blockedDates.length > 0 && (
          <span className="text-xs font-semibold text-text-primary/45">
            {blockedDates.length} date{blockedDates.length === 1 ? "" : "s"} blocked
          </span>
        )}
      </div>

      <div className="rounded-card bg-white p-6 shadow-card ring-1 ring-black/5 md:p-10 flex justify-center">
        <DayPicker
          mode="multiple"
          selected={selectedDates}
          onSelect={handleSelect}
          disabled={[
            { before: today } // Grey out past dates and make them non-selectable
          ]}
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
            disabled:       "rdp-day--disabled", // Applies greyed out styling to past dates
            selected:       "rdp-day--selected", // Highlights dates the vendor has blocked
            hidden:         "rdp-day--hidden",
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
      </div>
    </section>
  );
}
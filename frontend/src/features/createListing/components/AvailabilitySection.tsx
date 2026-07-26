// TODO(meks): swap the placeholder below for your existing calendar component, e.g.
// import AvailabilityCalendar from "@/components/booking/AvailabilityCalendar";

import { useListingStore } from "../store/useListingStore";

export default function AvailabilitySection() {
  const blockedDates = useListingStore((s) => s.form.pricing.availability.blockedDates);

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
          <span className="text-xs font-semibold text-text-primary/45">{blockedDates.length} date(s) blocked</span>
        )}
      </div>

      <div className="rounded-card bg-white p-6 shadow-card ring-1 ring-black/5 md:p-10">
        {/* <AvailabilityCalendar blockedDates={blockedDates} onToggleDate={toggleBlockedDate} /> */}
        <div className="flex h-64 items-center justify-center rounded-input border border-dashed border-black/10 text-sm text-text-primary/40">
          Your availability calendar component renders here
        </div>
      </div>
    </section>
  );
}
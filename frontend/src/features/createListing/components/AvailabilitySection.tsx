// TODO(meks): swap the placeholder below for your existing calendar component, e.g.
// import AvailabilityCalendar from "@/components/booking/AvailabilityCalendar";

import { CalendarDays } from "lucide-react";
import { useListingStore } from "../store/useListingStore";
import { DateRangePicker } from "@/features/search";

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

// export const AvailabilityCalender = () => {
//   const blockedDates = useListingStore((s) => s.form.pricing.availability.blockedDates);
//   const toggleBlockedDate = useListingStore((s) => s.toggleBlockedDate);
//   const unavailableDates = []
//   const listingId = ''

//   return (
//     <div className="rounded-[2rem] bg-[#F4F1EA] p-6 md:p-8">
//       <h3 className="mb-6 font-man text-xl font-extrabold text-[#252423]">
//         Select Date
//       </h3>

//         {/* ── Event Date — full width ─────────────────────────────────────── */}
//         <div>
//           <FieldLabel>Event Date</FieldLabel>
//           <FieldPill>
//             <CalendarDays className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
//             <DateRangePicker
//               value={dateRange}
//               onChange={onDateRangeChange}
//               unavailableDates={unavailableDates}
//               variant="ghost"
//               triggerClassName="flex-1 bg-transparent text-sm font-semibold text-[#252423] focus:outline-none text-left"
//               listingId = {listingId}
//             />
//           </FieldPill>
//         </div>
//       </div>
//   )};

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
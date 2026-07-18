"use client";

import { MessageSquare } from "lucide-react";
import { DateRangePicker } from "@/features/search/components/DateRange";
import { DateRange } from "@/features/search/utils/searchSchema";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";


interface BookingCardProps {
  booked: boolean;
  dateRange: DateRange | undefined;
  guests: string;
  time: string;
  onBook: () => void;
  onDateChange: (value: DateRange | undefined) => void;
  onGuestsChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  price: string;
  variant?: "desktop" | "mobile";
}

const GUEST_OPTIONS: DropdownOption[] = [
  { value: "1",   label: "1 guest"   },
  { value: "2",   label: "2 guests"  },
  { value: "10",  label: "10 guests" },
  { value: "50",  label: "50 guests" },
  { value: "200", label: "200 guests"},
];
 
const TIME_OPTIONS: DropdownOption[] = [
  { value: "morning",   label: "Morning",   description: "8 AM – 12 PM"  },
  { value: "afternoon", label: "Afternoon", description: "12 PM – 5 PM"  },
  { value: "evening",   label: "Evening",   description: "5 PM – 10 PM"  },
  { value: "fullday",   label: "Full Day",  description: "8 AM – 10 PM"  },
];

export default function BookingCard({
  booked,
  dateRange,
  guests,
  time,
  onBook,
  onDateChange,
  onGuestsChange,
  onTimeChange,
  price,
  variant = "desktop",
}: BookingCardProps) {
  const compact = variant === "mobile";
  

  return (
    <aside
      className={`rounded-4xl bg-white shadow-[0_24px_54px_rgba(34,27,18,0.1)] h-fit ${
        compact ? "p-6" : "sticky top-8 p-8"
      }`}
    >
      <div className="flex items-end justify-between">
        <p className="text-3xl font-extrabold text-[#252423]">
          {price}
          <span className="text-sm font-bold text-[#5E6588]">/day</span>
        </p>
       
      </div>

      <div className="mt-7 overflow-hidden rounded-[1.35rem] border border-[#E8DDD2]">
        <div className="border-b border-[#E8DDD2] bg-white">
          <DateRangePicker
            value={dateRange}
            onChange={onDateChange}
            issearch={false}
          />
        </div>
        <div className="grid grid-cols-2">
          <Dropdown
            label="Guests"
            variant="cell"
            size="md"
            options={GUEST_OPTIONS}
            value={guests}
            onChange={onGuestsChange}
            borderRight
          />
          <Dropdown
            label="Time"
            variant="cell"
            size="md"
            options={TIME_OPTIONS}
            value={time}
            onChange={onTimeChange}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onBook}
        className="mt-6 w-full rounded-full bg-[#B9401D] px-6 py-4 text-sm font-extrabold text-white transition hover:brightness-95"
      >
        {booked ? "Booking Request Sent" : "Check Availability"}
      </button>
      <button
        type="button"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-sm font-extrabold text-[#252423]"
      >
        <MessageSquare className="h-4 w-4" />
        Chat with Vendor
      </button>

      <p className="mt-5 text-center text-[11px] font-semibold text-[#7B7E9B]">You won&apos;t be charged yet</p>

      {!compact ? (
        <div className="mt-8 space-y-4 border-t border-[#EFE8DE] pt-6 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-[#5E6588] underline">Venue Hire Fee</span>
            <strong>{price}</strong>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-[#5E6588] underline">VAT (10%)</span>
            <strong>₦125,000</strong>
          </div>
          <div className="flex justify-between border-t border-[#EFE8DE] pt-4 text-base">
            <strong>Total</strong>
            <strong>₦1,375,000</strong>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

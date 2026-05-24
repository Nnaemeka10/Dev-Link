"use client";

import { MessageSquare } from "lucide-react";
import { BOOKING_GUESTS, BOOKING_TIMES } from "../../details.data";

interface BookingCardProps {
  booked: boolean;
  date: string;
  guests: string;
  time: string;
  onBook: () => void;
  onDateChange: (value: string) => void;
  onGuestsChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  price: string;
  variant?: "desktop" | "mobile";
}

export default function BookingCard({
  booked,
  date,
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
          <span className="text-sm font-bold text-[#5E6588]">/event</span>
        </p>
       
      </div>

      <div className="mt-7 overflow-hidden rounded-[1.35rem] border border-[#E8DDD2]">
        <label className="block border-b border-[#E8DDD2] px-4 py-3">
          <span className="text-tiny font-extrabold uppercase text-[#9A9AAE]">Event Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-semibold text-[#6B5D55] focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-2">
          <label className="block border-r border-[#E8DDD2] px-4 py-3">
            <span className="text-tiny font-extrabold uppercase text-[#9A9AAE]">Guests</span>
            <select
              value={guests}
              onChange={(event) => onGuestsChange(event.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-semibold text-[#6B5D55] focus:outline-none"
            >
              {BOOKING_GUESTS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="block px-4 py-3">
            <span className="text-tiny font-extrabold uppercase text-[#9A9AAE]">Time</span>
            <select
              value={time}
              onChange={(event) => onTimeChange(event.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-semibold text-[#6B5D55] focus:outline-none"
            >
              {BOOKING_TIMES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
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
            <span className="font-semibold text-[#5E6588] underline">Service Charge (10%)</span>
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

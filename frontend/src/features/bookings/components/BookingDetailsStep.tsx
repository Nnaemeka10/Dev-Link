"use client";

import Image from "next/image";
import { CalendarDays, ChevronDown, Minus, Plus, UsersRound } from "lucide-react";
import { BOOKING_VENUE } from "../booking.data";
import type { BookingFormState } from "../booking.types";
import { EstimateSummary, VenueSelectionCard } from "./BookingSummary";

interface BookingDetailsStepProps {
  form: BookingFormState;
  onContinue: () => void;
  onUpdate: (patch: Partial<BookingFormState>) => void;
  variant?: "desktop" | "mobile";
}

function updateGuestCount(value: number) {
  return Math.min(Math.max(value, 1), 500);
}

export default function BookingDetailsStep({ form, onContinue, onUpdate, variant = "desktop" }: BookingDetailsStepProps) {
  if (variant === "mobile") {
    return (
      <section className="px-6 pb-28">
        <article className="flex items-center gap-5 rounded-[2rem] bg-white p-5 shadow-[0_18px_40px_rgba(34,27,18,0.08)]">
          <Image src={BOOKING_VENUE.image} alt={BOOKING_VENUE.name} className="h-24 w-24 rounded-[1.4rem] object-cover" />
          <div>
            <h2 className="text-xl font-extrabold">{BOOKING_VENUE.name}</h2>
            <p className="text-sm font-semibold text-[#555B7F]">{BOOKING_VENUE.location}</p>
            <p className="mt-2 inline-flex rounded-full bg-[#FFE3A2] px-3 py-1 text-xs font-extrabold">★ {BOOKING_VENUE.rating} ({BOOKING_VENUE.reviewsCount})</p>
          </div>
        </article>

        <label className="mt-9 block">
          <span className="text-base font-medium">Select Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => onUpdate({ date: event.target.value })}
            className="mt-5 w-full rounded-[1.7rem] bg-[#F1EEE8] px-6 py-5 text-base font-extrabold focus:outline-none"
          />
        </label>

        <div className="mt-9">
          <p className="text-base font-medium">Number of Guests</p>
          <div className="mt-5 flex items-center justify-between rounded-full bg-[#E8E4DC] p-4">
            <button type="button" onClick={() => onUpdate({ guests: updateGuestCount(form.guests - 1) })} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white">
              <Minus className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-2xl font-extrabold">{form.guests}</p>
              <p className="text-xs font-semibold text-[#555B7F]">Max 500 capacity</p>
            </div>
            <button type="button" onClick={() => onUpdate({ guests: updateGuestCount(form.guests + 1) })} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#B9401D] text-white">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-9 rounded-[2rem] bg-[#F4F1EA] p-6">
          <p className="font-medium">Price Summary</p>
          <div className="mt-5 space-y-4 border-b border-[#E2DBD1] pb-4 text-[#555B7F]">
            <div className="flex justify-between"><span>Base Venue Fee</span><strong className="text-[#252423]">₦1,250,000</strong></div>
            <div className="flex justify-between"><span>Service Charge (10%)</span><strong className="text-[#252423]">₦125,000</strong></div>
          </div>
          <div className="mt-4 flex justify-between text-xl font-extrabold">
            <span>Total</span>
            <span className="text-[#B9401D]">₦1,375,000</span>
          </div>
        </div>

        <details className="mt-9 border-b border-[#E2DBD1] pb-5" open>
          <summary className="cursor-pointer text-base font-extrabold">Contract & Cancellation Policy</summary>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-6 text-[#555B7F]">
            <li>Free cancellation within 48 hours of booking.</li>
            <li>50% deposit required to secure the date.</li>
            <li>Alcohol permit included in base price.</li>
          </ul>
        </details>

        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between bg-bg-primary px-6 py-5 shadow-[0_-12px_32px_rgba(34,27,18,0.08)]">
          <button type="button" className="font-extrabold text-[#555B7F]">‹ Previous</button>
          <button type="button" onClick={onContinue} className="rounded-full bg-[#B9401D] px-10 py-4 font-extrabold text-white">Continue →</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-8 px-8 py-16 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="space-y-8">
        <VenueSelectionCard />
        <div className="rounded-[2rem] bg-[#F4F1EA] p-8">
          <div className="grid gap-7 md:grid-cols-2">
            <label>
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">Event Date</span>
              <span className="mt-3 flex items-center rounded-full bg-[#E0DDD6] px-5 py-4">
                <input type="date" value={form.date} onChange={(event) => onUpdate({ date: event.target.value })} className="w-full bg-transparent focus:outline-none" />
                <CalendarDays className="h-5 w-5 text-[#555B7F]" />
              </span>
            </label>
            <label>
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">Guest Count</span>
              <span className="mt-3 flex items-center rounded-full bg-[#E0DDD6] px-5 py-4">
                <input type="number" min={1} max={500} value={form.guests} onChange={(event) => onUpdate({ guests: updateGuestCount(Number(event.target.value)) })} className="w-full bg-transparent focus:outline-none" />
                <UsersRound className="h-5 w-5 text-[#555B7F]" />
              </span>
            </label>
          </div>
          <div className="mt-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">Preferred Time Block</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {["Morning", "Afternoon", "Full Day"].map((label) => (
                <button key={label} type="button" className={`rounded-full px-6 py-4 font-extrabold ${label === "Morning" ? "bg-[#B9401D] text-white" : "bg-[#E0DDD6]"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <details className="rounded-[1.5rem] bg-[#F4F1EA] p-6">
          <summary className="flex cursor-pointer items-center justify-between font-extrabold">Contract Terms & Cancellation Policy <ChevronDown className="h-4 w-4" /></summary>
          <p className="mt-4 text-sm leading-6 text-[#6B5F57]">By proceeding, you agree to venue house rules and deposit terms.</p>
        </details>
      </div>
      <EstimateSummary onContinue={onContinue} />
    </section>
  );
}

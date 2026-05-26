"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { BOOKING_FEES, BOOKING_TOTAL, BOOKING_VENUE } from "../booking.data";
import type { BookingFormState } from "../booking.types";
import { EstimateSummary, VenueSelectionCard } from "./BookingSummary";
import { DateTimeSection } from "./DateTimeSection";
import { useRouter } from "next/navigation";

interface BookingDetailsStepProps {
  form: BookingFormState;
  onContinue: () => void;
  onUpdate: (patch: Partial<BookingFormState>) => void;
  variant?: "desktop" | "mobile";
}



export default function BookingDetailsStep({ form, onContinue, onUpdate, variant = "desktop" }: BookingDetailsStepProps) {
  const router = useRouter();
  if (variant === "mobile") {
    
    return (
      <section className="px-6 pb-28">
        <article className="flex items-center gap-5 rounded-[2rem] bg-white p-5 shadow-[0_18px_40px_rgba(34,27,18,0.08)]">
          <Image src={BOOKING_VENUE.image} alt={BOOKING_VENUE.name} className="h-24 w-24 rounded-[1.4rem] object-cover" />
          <div>
            <h2 className="text-lg font-extrabold">{BOOKING_VENUE.name}</h2>
            <p className="text-xs font-semibold text-[#555B7F]">{BOOKING_VENUE.location}</p>
            <p className="mt-2 inline-flex rounded-full bg-[#FFE3A2] px-3 py-1 text-tiny font-extrabold">★ {BOOKING_VENUE.rating} ({BOOKING_VENUE.reviewsCount})</p>
            <p className="mt-2 text-tiny font-extrabold text-[#B9401D]">{BOOKING_VENUE.capacity}</p>
          </div>
        </article>
        <DateTimeSection 
          dateRange = {form.dateRange} 
          startTime = {form.startTime} 
          endTime = {form.endTime} 
          guests = {form.guests} 
          onDateRangeChange = { (dateRange) => onUpdate({ dateRange }) } 
          onStartTimeChange = { (time) => onUpdate({ startTime: time }) } 
          onEndTimeChange = { (time) => onUpdate({ endTime: time }) } 
          onGuestsChange = { (guests) => onUpdate({ guests }) } 
        />
       

        <div className="mt-9 rounded-[2rem] bg-[#F4F1EA] p-6">
          <h2 className="text-2xl font-medium text-[#252423]">Estimated Cost</h2>
          <div className="mt-7 space-y-5 border-b border-[#E8DED2] pb-6">
            {BOOKING_FEES.map((fee) => (
              <div key={fee.label} className="flex justify-between gap-8 text-base">
                <span className="text-[#6B5F57]">{fee.label}</span>
                <strong>{fee.value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="font-extrabold text-[#252423]">Total Estimate</p>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7B7E9B]">VAT inclusive where applicable</p>
            </div>
            <strong className="text-3xl font-extrabold text-[#B9401D]">{BOOKING_TOTAL}</strong>
          </div>
          <button type="button" onClick={onContinue} className="mt-8 w-full rounded-full bg-[#B9401D] px-8 py-5 text-lg font-extrabold text-white shadow-[0_16px_26px_rgba(185,64,29,0.2)]">
            Proceed to Payment
          </button>
          <p className="mx-auto mt-6 max-w-xs text-center text-xs leading-5 text-[#555B7F]">
            Your payment is secure. You won&apos;t be charged until the vendor confirms your booking request within 24 hours.
          </p>
        </div>

        <details className="mt-9 mb-36 border-b border-[#E2DBD1] pb-5" open>
          <summary className="cursor-pointer text-base font-extrabold">Contract & Cancellation Policy</summary>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-6 text-[#555B7F]">
            <li>Free cancellation within 48 hours of booking.</li>
            <li>50% deposit required to secure the date.</li>
            <li>Alcohol permit included in base price.</li>
          </ul>
        </details>

        <div className="fixed inset-x-0 bottom-20 z-40 flex items-center justify-between bg-bg-primary px-6 py-5 shadow-[0_-12px_32px_rgba(34,27,18,0.08)]">
          <button type="button" onClick = {() => router.back()} className="font-extrabold text-[#555B7F]">‹ Previous</button>
          <button type="button" onClick={onContinue} className="rounded-full bg-[#B9401D] px-10 py-4 font-extrabold text-white">Continue →</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-16 px-8 py-16 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="space-y-8">
        <VenueSelectionCard />
        <DateTimeSection 
          dateRange = {form.dateRange} 
          startTime = {form.startTime} 
          endTime = {form.endTime} 
          guests = {form.guests} 
          onDateRangeChange = { (dateRange) => onUpdate({ dateRange }) } 
          onStartTimeChange = { (time) => onUpdate({ startTime: time }) } 
          onEndTimeChange = { (time) => onUpdate({ endTime: time }) } 
          onGuestsChange = { (guests) => onUpdate({ guests }) } 
        />
        <details className="rounded-3xl bg-[#F4F1EA] p-6">
          <summary className="flex cursor-pointer items-center justify-between font-extrabold">Contract Terms & Cancellation Policy <ChevronDown className="h-4 w-4" /></summary>
          <p className="mt-4 text-sm leading-6 text-[#6B5F57]">By proceeding, you agree to venue house rules and deposit terms.</p>
        </details>
      </div>
      <EstimateSummary onContinue={onContinue} />
    </section>
  );
}

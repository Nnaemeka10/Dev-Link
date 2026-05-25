"use client";

import { CalendarDays, CheckCircle, CreditCard, UsersRound } from "lucide-react";
import type { BookingFormState } from "../booking.types";
import { BOOKING_FEES, BOOKING_TOTAL, BOOKING_VENUE, HOST_CONTACT } from "../booking.data";
import { formatTriggerLabel } from "@/features/search/components/DateRange";

export default function ReviewStep({
  form,
  onConfirm,
}: {
  form: BookingFormState;
  onConfirm: () => void;
}) {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-8 py-16 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="rounded-[2rem] bg-white p-8 shadow-[0_24px_54px_rgba(34,27,18,0.07)]">
        <h1 className="text-3xl font-extrabold">Review Your Booking</h1>
        <p className="mt-2 text-[#555B7F]">Confirm the details below before we secure your reservation.</p>

        <div className="mt-8 grid gap-5">
          {[
            { label: "Venue", value: BOOKING_VENUE.name, icon: CheckCircle },
            { label: "Date", value: formatTriggerLabel(form.dateRange) || "December 14, 2024", icon: CalendarDays },
            { label: "Guests", value: `${form.guests} Attendees`, icon: UsersRound },
            { label: "Payment Method", value: form.paymentMethod.toUpperCase(), icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 rounded-[1.2rem] bg-[#F4F1EA] p-5">
                <Icon className="h-5 w-5 text-[#B9401D]" />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">{item.label}</p>
                  <p className="mt-1 font-extrabold">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="rounded-[2rem] bg-[#E8E4DC] p-8">
        <h2 className="text-xl font-medium">Final Summary</h2>
        <div className="mt-6 space-y-4">
          {BOOKING_FEES.map((fee) => (
            <div key={fee.label} className="flex justify-between gap-6">
              <span className="text-[#5F5550]">{fee.label}</span>
              <strong>{fee.value}</strong>
            </div>
          ))}
        </div>
        <div className="mt-7 flex justify-between border-t border-[#D8D1C7] pt-5">
          <strong>Total</strong>
          <strong className="text-2xl text-[#B9401D]">{BOOKING_TOTAL}</strong>
        </div>
        <div className="mt-8 rounded-[1.4rem] bg-white p-5">
          <p className="text-sm font-extrabold">{HOST_CONTACT.name}</p>
          <p className="text-sm text-[#555B7F]">{HOST_CONTACT.role}</p>
        </div>
        <button type="button" onClick={onConfirm} className="mt-8 w-full rounded-full bg-[#B9401D] px-8 py-5 font-extrabold text-white">
          Confirm Booking
        </button>
      </aside>
    </section>
  );
}

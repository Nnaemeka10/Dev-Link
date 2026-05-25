import Image from "next/image";
import { MapPin, ShieldCheck } from "lucide-react";
import { BOOKING_FEES, BOOKING_TOTAL, BOOKING_VENUE, PAYMENT_FEES, PAYMENT_TOTAL } from "../booking.data";

export function EstimateSummary({ onContinue }: { onContinue: () => void }) {
  return (
    <aside className="rounded-[2.2rem] h-fit bg-white p-8 shadow-[0_24px_54px_rgba(34,27,18,0.08)]">
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
    </aside>
  );
}

export function PaymentSummary({ onPay }: { onPay: () => void }) {
  return (
    <aside className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_54px_rgba(34,27,18,0.08)]">
      <div className="relative h-64">
        <Image src={BOOKING_VENUE.image} alt={BOOKING_VENUE.name} fill className="object-cover brightness-75" sizes="34vw" />
        <div className="absolute bottom-6 left-8 text-white">
          <h2 className="text-xl font-extrabold">{BOOKING_VENUE.name}, Victoria Island</h2>
          <p className="text-sm">Lagos, Nigeria</p>
        </div>
      </div>
      <div className="p-8">
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-8 border-b border-[#E8DED2] pb-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Event Date</p>
            <p className="mt-2 font-extrabold">December 24, 2024</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Guests</p>
            <p className="mt-2 font-extrabold">350 Attendees</p>
          </div>
        </div>
        <div className="mt-7 space-y-5">
          {PAYMENT_FEES.map((fee) => (
            <div key={fee.label} className="flex justify-between">
              <span className="text-[#555B7F]">{fee.label}</span>
              <strong>{fee.value}</strong>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-[1.5rem] bg-[#E8E4DC] p-6">
          <div className="flex items-end justify-between">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Total Amount</p>
            <strong className="text-3xl font-extrabold text-[#B9401D]">{PAYMENT_TOTAL}</strong>
          </div>
          <p className="mt-2 text-right text-[11px] text-[#9A756C]">Includes all taxes and marketplace fees</p>
        </div>
        <button type="button" onClick={onPay} className="mt-8 w-full rounded-full bg-[#D95A3D] px-8 py-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white">
          Pay Now →
        </button>
      </div>
    </aside>
  );
}

export function VenueSelectionCard() {
  return (
    <article className="flex items-center gap-6 rounded-[2.2rem] bg-white p-8 shadow-[0_24px_54px_rgba(34,27,18,0.06)]">
      <Image src={BOOKING_VENUE.image} alt={BOOKING_VENUE.name} className="h-28 w-28 rounded-[1.4rem] object-cover" />
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#555B7F]">Current Selection</p>
        <h2 className="mt-2 text-2xl font-extrabold text-[#252423]">{BOOKING_VENUE.name}</h2>
        <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#555B7F]">
          <MapPin className="h-4 w-4" />
          {BOOKING_VENUE.location}
        </p>
        <p className="mt-2 text-xs font-extrabold text-[#B9401D]">{BOOKING_VENUE.capacity}</p>
      </div>
    </article>
  );
}

export function SecuritySignals() {
  return (
    <div className="mt-10 grid gap-6 text-sm font-extrabold md:grid-cols-3">
      {["256-bit SSL Encrypted", "Vendor Protection", "Verified Provider"].map((label) => (
        <div key={label} className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#B9401D]" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

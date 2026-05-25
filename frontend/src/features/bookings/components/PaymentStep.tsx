"use client";

import { Bitcoin, Building2, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import type { BookingFormState, BookingPaymentMethod } from "../booking.types";
import { PaymentSummary, SecuritySignals } from "./BookingSummary";
import { BOOKING_VENUE, PAYMENT_FEES, PAYMENT_TOTAL } from "../booking.data";
import { MobilePaymentDock } from "./MobilePaymentDock";

interface PaymentStepProps {
  form: BookingFormState;
  onPay: () => void;
  onUpdate: (patch: Partial<BookingFormState>) => void;
  variant?: "desktop" | "mobile";
}

const PAYMENT_OPTIONS: Array<{ id: BookingPaymentMethod; label: string; icon: typeof CreditCard }> = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "transfer", label: "Transfer", icon: Building2 },
  { id: "crypto", label: "Crypto (USDT)", icon: Bitcoin },
];

function PaymentOptions({ value, onChange }: { value: BookingPaymentMethod; onChange: (method: BookingPaymentMethod) => void }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {PAYMENT_OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative rounded-[1.7rem] px-6 py-7 text-center font-extrabold ${
              active ? "border-2 border-[#B9401D] bg-white text-[#252423]" : "bg-[#F4F1EA] text-[#555B7F]"
            }`}
          >
            <Icon className="mx-auto h-8 w-8 text-[#B9401D]" />
            <span className="mt-3 block">{option.label}</span>
            {active ? <span className="absolute right-4 top-4 h-4 w-4 rounded-full bg-[#B9401D]" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function CardFields({ form, onUpdate }: Pick<PaymentStepProps, "form" | "onUpdate">) {
  return (
    <div className="rounded-[2rem] bg-[#F4F1EA] p-8">
      <div className="grid gap-6">
        <label>
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">Cardholder Name</span>
          <input value={form.cardName} onChange={(event) => onUpdate({ cardName: event.target.value })} placeholder="Olumide Balogun" className="mt-3 w-full rounded-md bg-[#E0DDD6] px-5 py-4 focus:outline-none" />
        </label>
        <label>
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">Card Number</span>
          <span className="mt-3 flex items-center rounded-md bg-[#E0DDD6] px-5 py-4">
            <input value={form.cardNumber} onChange={(event) => onUpdate({ cardNumber: event.target.value })} placeholder="0000 0000 0000 0000" className="w-full bg-transparent focus:outline-none" />
            <LockKeyhole className="h-5 w-5 text-[#9A756C]" />
          </span>
        </label>
        <div className="grid grid-cols-2 gap-6">
          <label>
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">Expiry Date</span>
            <input value={form.cardExpiry} onChange={(event) => onUpdate({ cardExpiry: event.target.value })} placeholder="MM / YY" className="mt-3 w-full rounded-md bg-[#E0DDD6] px-5 py-4 focus:outline-none" />
          </label>
          <label>
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">CVV</span>
            <input value={form.cardCvv} onChange={(event) => onUpdate({ cardCvv: event.target.value })} placeholder="***" className="mt-3 w-full rounded-md bg-[#E0DDD6] px-5 py-4 focus:outline-none" />
          </label>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStep({ form, onPay, onUpdate, variant = "desktop" }: PaymentStepProps) {

  const summary = {
    venueName:     BOOKING_VENUE.name,           // "The Grand Atrium"
    venueLocation: "Victoria Island, Lagos",
    venueImage:    BOOKING_VENUE.image,
    eventName:     "Corporate Dinner",            // "Corporate Dinner"
    eventDate:     "December 24, 2024",            // "December 24, 2024"
    guests:        `350 Attendees`,
    verified:      true,
    fees:          PAYMENT_FEES,                 // your existing array
    total:         PAYMENT_TOTAL,                // "₦495,000"
    totalNote:     "Includes all taxes and marketplace fees",
  };

  if (variant === "mobile") {
    return (
      <section className="px-6 pb-28">
        <h1 className="text-2xl font-medium">Select Method</h1>
        <div className="mt-6">
          <PaymentOptions value={form.paymentMethod} onChange={(paymentMethod) => onUpdate({ paymentMethod })} />
        </div>
        <div className="mt-8">
          <CardFields form={form} onUpdate={onUpdate} />
        </div>
        <MobilePaymentDock summary={summary} onPay={onPay} />
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-8 py-16 lg:grid-cols-[minmax(0,1fr)_29rem]">
      <div>
        <h1 className="text-4xl font-medium">Payment Method</h1>
        <p className="mt-3 text-lg text-[#555B7F]">Select your preferred way to secure your booking.</p>
        <div className="mt-9">
          <PaymentOptions value={form.paymentMethod} onChange={(paymentMethod) => onUpdate({ paymentMethod })} />
        </div>
        <div className="mt-8">
          <CardFields form={form} onUpdate={onUpdate} />
        </div>
        <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#555B7F]">
          <ShieldCheck className="h-4 w-4 text-[#B9401D]" />
          Your transaction is secured with 256-bit SSL encryption.
        </div>
        <SecuritySignals />
      </div>
      <PaymentSummary onPay={onPay} />
    </section>
  );
}

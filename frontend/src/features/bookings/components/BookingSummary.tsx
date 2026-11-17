"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { PaymentSummaryData } from "../booking.types";
import HoldCountdown from "./HoldCountdown";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function DetailTile({
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3.5 ${
        wide ? "col-span-full" : ""
      }`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#B9401D] shadow-sm">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-extrabold leading-snug text-[#252423]">{value}</p>
      </div>
    </div>
  );
}

export function PaymentSummary({
  summary,
  onPay,
  isProcessing,
  holdExpiresAt,
}: {
  summary: PaymentSummaryData;
  onPay: () => void;
  isProcessing: boolean;
  holdExpiresAt: string | null;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="h-fit overflow-hidden rounded-4xl bg-white shadow-[0_24px_54px_rgba(34,27,18,0.08)] lg:sticky lg:top-8"
    >
      {/* Identity header */}
      <div className="relative h-52">
        <Image
          src={summary.venueImage}
          alt={summary.venueName}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 34vw"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-[#1B140E]/85 via-[#1B140E]/25 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#B9401D] backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Escrow protected
          </span>
          {summary.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#B9401D] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Instant approval
            </span>
          )}
        </div>
        <div className="absolute inset-x-6 bottom-5 text-white">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">
            {summary.kind === "service" ? "Service" : "Venue"}
          </p>
          <h2 className="mt-1 truncate text-xl font-extrabold">{summary.venueName}</h2>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Event facts */}
        <div className="grid grid-cols-2 gap-2.5">
          <DetailTile
            icon={MapPin}
            label={summary.locationLabel}
            value={summary.venueLocation || "Location not set"}
            wide
          />
          <DetailTile icon={CalendarDays} label="Event dates" value={summary.eventDateLabel} wide />
          <DetailTile icon={Clock} label="Time (24h)" value={summary.eventTimeLabel} />
          {summary.guests ? (
            <DetailTile icon={UsersRound} label="Guests" value={summary.guests} />
          ) : (
            <DetailTile icon={BadgeCheck} label="Booking" value={summary.eventName} />
          )}
        </div>

        {/* Price breakdown */}
        <div className="mt-6 space-y-3.5 border-t border-[#E8DED2] pt-6">
          {summary.fees.length === 0 ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-3/4 rounded bg-[#EFE7DE]" />
              <div className="h-4 w-1/2 rounded bg-[#EFE7DE]" />
            </div>
          ) : (
            summary.fees.map((fee) => (
              <div key={fee.label} className="flex items-start justify-between gap-4 text-sm">
                <span
                  className={`text-[#5E6588] ${
                    fee.sublabel ? "underline decoration-[#D8CDBF] underline-offset-2" : ""
                  }`}
                >
                  {fee.label}
                </span>
                <strong className="shrink-0 text-[#252423]">{fee.value}</strong>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        <div className="mt-6 rounded-3xl bg-[#F4F1EA] p-5">
          <div className="flex items-end justify-between gap-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">
              Total amount
            </p>
            <motion.strong
              key={summary.total}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="shrink-0 text-2xl font-extrabold text-[#B9401D] md:text-3xl"
            >
              {summary.total}
            </motion.strong>
          </div>
          {summary.totalNote && (
            <p className="mt-2 text-right text-[11px] font-semibold text-[#9A756C]">
              {summary.totalNote}
            </p>
          )}
        </div>

        <HoldCountdown expiresAt={holdExpiresAt} className="mt-5" />

        <button
          type="button"
          onClick={onPay}
          disabled={isProcessing}
          className="mt-5 w-full rounded-full bg-[#B9401D] px-8 py-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_16px_26px_rgba(185,64,29,0.2)] transition-all hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isProcessing ? "Processing…" : "Pay securely now"}
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#555B7F]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#B9401D]" aria-hidden="true" />
          Card, bank &amp; transfer · powered by Paystack
        </p>
      </div>
    </motion.aside>
  );
}

export function SecuritySignals() {
  const signals = [
    { icon: ShieldCheck, label: "256-bit encrypted checkout" },
    { icon: LockKeyholeIcon, label: "Funds held in escrow" },
    { icon: BadgeCheck, label: "Verified provider" },
  ];
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {signals.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-2.5 rounded-2xl bg-[#F7F2EA] px-4 py-3 text-xs font-extrabold text-[#3A3734]"
        >
          <Icon className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
          {label}
        </div>
      ))}
    </div>
  );
}

/** Local alias so the signals row keeps its own lock glyph. */
function LockKeyholeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
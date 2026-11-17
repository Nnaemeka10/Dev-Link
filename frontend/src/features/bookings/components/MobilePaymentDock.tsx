"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  BadgeCheck,
  CalendarDays,
  ChevronUp,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import type { PaymentSummaryData } from "../booking.types";
import HoldCountdown from "./HoldCountdown";

interface MobilePaymentDockProps {
  summary: PaymentSummaryData;
  onPay: () => void;
  isProcessing: boolean;
  holdExpiresAt: string | null;
}

const sheetVariants = { hidden: { y: "100%" }, visible: { y: 0 } };
const sheetTransition = { type: "spring" as const, bounce: 0.16, duration: 0.42 };

function SheetRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#B9401D] shadow-sm">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
          {label}
        </p>
        <p className="mt-0.5 text-small font-extrabold leading-snug text-[#252423]">{value}</p>
      </div>
    </div>
  );
}

function SummarySheet({
  summary,
  onClose,
  onPay,
  isProcessing,
}: {
  summary: PaymentSummaryData;
  onClose: () => void;
  onPay: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="flex max-h-[92dvh] flex-col">
      <div className="flex shrink-0 justify-center pb-1 pt-3">
        <div className="h-1 w-10 rounded-full bg-[#E8DDD2]" aria-hidden="true" />
      </div>

      <div className="flex shrink-0 items-center justify-between px-5 py-3">
        <h3 className="text-base font-extrabold text-[#252423]">Booking summary</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close summary"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#252423] transition-colors hover:bg-[#EDE8DE]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 [scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar]:w-1.5">
        {/* Identity */}
        <div className="relative h-36 overflow-hidden rounded-2xl">
          <Image
            src={summary.venueImage}
            alt={summary.venueName}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-[#1B140E]/85 via-[#1B140E]/20 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#B9401D]">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Escrow
            </span>
            {summary.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#B9401D] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Instant
              </span>
            )}
          </div>
          <div className="absolute inset-x-4 bottom-3 text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">
              {summary.kind === "service" ? "Service" : "Venue"}
            </p>
            <p className="truncate text-base font-extrabold leading-tight">{summary.venueName}</p>
          </div>
        </div>

        {/* Facts */}
        <div className="mt-3 space-y-2.5">
          <SheetRow
            icon={MapPin}
            label={summary.locationLabel}
            value={summary.venueLocation || "Location not set"}
          />
          <SheetRow icon={CalendarDays} label="Event dates" value={summary.eventDateLabel} />
          <SheetRow icon={Clock} label="Time (24h)" value={summary.eventTimeLabel} />
          {summary.guests ? (
            <SheetRow icon={UsersRound} label="Guests" value={summary.guests} />
          ) : (
            <SheetRow icon={BadgeCheck} label="Booking" value={summary.eventName} />
          )}
        </div>

        {/* Breakdown */}
        <div className="mt-3 space-y-3 rounded-2xl border border-[#EFE8DE] bg-white px-4 py-4">
          {summary.fees.length === 0 ? (
            <div className="animate-pulse space-y-3">
              <div className="h-3.5 w-3/4 rounded bg-[#EFE7DE]" />
              <div className="h-3.5 w-1/2 rounded bg-[#EFE7DE]" />
            </div>
          ) : (
            summary.fees.map((fee) => (
              <div key={fee.label} className="flex items-start justify-between gap-3 text-small">
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
        <div className="mt-3 rounded-2xl bg-[#F4F1EA] px-4 py-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">
              Total
            </p>
            <strong className="text-lg font-extrabold text-[#B9401D]">{summary.total}</strong>
          </div>
          {summary.totalNote && (
            <p className="mt-1.5 text-right text-tiny font-semibold text-[#9A756C]">
              {summary.totalNote}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#EFE8DE] px-5 pb-[env(safe-area-inset-bottom,1rem)] pt-4">
        <button
          type="button"
          onClick={() => {
            onClose();
            onPay();
          }}
          disabled={isProcessing}
          className="w-full rounded-full bg-[#B9401D] py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? "Processing…" : "Pay now"}
        </button>
        <p className="mt-3 text-center text-[11px] font-semibold text-[#7B7E9B]">
          Full refund if the vendor doesn&apos;t confirm within 24 hours.
        </p>
      </div>
    </div>
  );
}

export function MobilePaymentDock({
  summary,
  onPay,
  isProcessing,
  holdExpiresAt,
}: MobilePaymentDockProps) {
  const [open, setOpen] = useState(false);
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-20 z-40 border-t border-[#EFE8DE] bg-bg-primary/97 px-5 py-3 shadow-[0_-8px_32px_rgba(34,27,18,0.08)] backdrop-blur">
        <HoldCountdown expiresAt={holdExpiresAt} className="mb-2.5 w-full justify-center" />
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="View booking summary"
            className="flex min-w-0 flex-col items-start text-left"
          >
            <span className="flex max-w-full items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">
              <span className="max-w-40 truncate">{summary.venueName}</span>
              <ChevronUp className="h-3 w-3 shrink-0 text-[#B9401D]" aria-hidden="true" />
            </span>
            <span className="text-base font-extrabold text-[#252423]">{summary.total}</span>
            <span className="text-micro font-bold text-[#B9401D] underline underline-offset-2">
              See details
            </span>
          </button>

          <button
            type="button"
            onClick={onPay}
            disabled={isProcessing}
            className="shrink-0 rounded-full bg-[#B9401D] px-7 py-3.5 text-small font-extrabold text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? "Processing…" : "Pay now"}
          </button>
        </div>
      </div>

      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="scrim"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-50 bg-[#1B140E]/40 backdrop-blur-[2px]"
                  aria-hidden="true"
                />
                <motion.div
                  key="sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Booking summary"
                  variants={sheetVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={sheetTransition}
                  className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-4xl bg-white shadow-[0_-8px_48px_rgba(36,28,18,0.18)]"
                  style={{ maxHeight: "92dvh" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <SummarySheet
                    summary={summary}
                    onClose={() => setOpen(false)}
                    onPay={onPay}
                    isProcessing={isProcessing}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          portalTarget
        )}
    </>
  );
}
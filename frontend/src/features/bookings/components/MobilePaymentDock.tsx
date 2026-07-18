"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image, { StaticImageData } from "next/image";
import {
  X, ChevronUp, MapPin, Users, CalendarDays, BadgeCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Fee {
  label: string;
  value: string;
  sublabel?: string; // e.g. "underline" fees like "Venue hire × 2 days"
}

interface BookingSummary {
  venueName: string;
  venueLocation: string;   // e.g. "Victoria Island, Lagos"
  venueImage: string | StaticImageData;      // image src
  eventName: string;       // e.g. "Corporate Dinner"
  eventDate: string;       // e.g. "December 24, 2024"
  guests: string;          // e.g. "350 Attendees"
  verified: boolean;
  fees: Fee[];
  total: string;           // formatted e.g. "₦495,000"
  totalNote?: string;      // e.g. "Includes all taxes and marketplace fees"
}

interface MobilePaymentDockProps {
  summary: BookingSummary;
  onPay: () => void;
  isProcessing: boolean;
}

// ─── Sheet variants ───────────────────────────────────────────────────────────

const sheetVariants = {
  hidden:  { y: "100%" },
  visible: { y: 0 },
};

const sheetTransition = {
  type: "spring" as const,
  bounce: 0.16,
  duration: 0.42,
};

// ─── Summary sheet ────────────────────────────────────────────────────────────

function SummarySheet({
  summary,
  onClose,
  onPay,
}: {
  summary: BookingSummary;
  onClose: () => void;
  onPay: () => void;
}) {
  return (
    <div className="flex max-h-[92dvh] flex-col">

      {/* Drag handle */}
      <div className="flex shrink-0 justify-center pb-1 pt-3">
        <div className="h-1 w-10 rounded-full bg-[#E8DDD2]" />
      </div>

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-5 py-3">
        <h3 className="text-base font-extrabold text-[#252423]">Booking Summary</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close summary"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#252423] transition-colors hover:bg-[#EDE8DE]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pb-2">

        {/* ── Venue card ────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl">
          <div className="relative h-36">
            <Image
              src={summary.venueImage}
              alt={summary.venueName}
              fill
              sizes="100vw"
              className="object-cover brightness-75"
            />
            {summary.verified && (
              <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-[#B9401D] backdrop-blur-sm">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            )}
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-base font-extrabold leading-tight">{summary.venueName}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-white/80">
                <MapPin className="h-3 w-3" />
                {summary.venueLocation}
              </p>
            </div>
          </div>
        </div>

        {/* ── Event details ──────────────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {/* Event name */}
          <div className="col-span-3 flex items-center gap-2.5 rounded-2xl bg-[#F4F1EA] px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#B9401D] shadow-sm">
              <BadgeCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">
                Event
              </p>
              <p className="text-sm font-extrabold text-[#252423]">{summary.eventName}</p>
            </div>
          </div>

          {/* Date */}
          <div className="col-span-2 flex items-center gap-2.5 rounded-2xl bg-[#F4F1EA] px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#B9401D] shadow-sm">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">
                Date
              </p>
              <p className="text-sm font-extrabold text-[#252423]">{summary.eventDate}</p>
            </div>
          </div>

          {/* Guests */}
          <div className="flex items-center gap-2 rounded-2xl bg-[#F4F1EA] px-3 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#B9401D] shadow-sm">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">
                Guests
              </p>
              <p className="text-sm font-extrabold text-[#252423]">{summary.guests}</p>
            </div>
          </div>
        </div>

        {/* ── Price breakdown ────────────────────────────────────────────── */}
        <div className="mt-4 space-y-3.5 rounded-2xl border border-[#EFE8DE] bg-white px-4 py-4">
          {summary.fees.map((fee) => (
            <div key={fee.label} className="flex items-start justify-between gap-2 text-sm">
              <span
                className={`text-[#5E6588] ${fee.sublabel ? "underline underline-offset-2" : ""}`}
              >
                {fee.label}
              </span>
              <strong className="shrink-0 text-[#252423]">{fee.value}</strong>
            </div>
          ))}
        </div>

        {/* ── Total ─────────────────────────────────────────────────────── */}
        <div className="mt-3 rounded-2xl bg-[#E8E4DC] px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#555B7F]">
              Total
            </p>
            <strong className="text-xl font-extrabold text-[#B9401D]">
              {summary.total}
            </strong>
          </div>
          {summary.totalNote && (
            <p className="mt-1 text-right text-[10px] text-[#9A756C]">
              {summary.totalNote}
            </p>
          )}
        </div>

      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pb-[env(safe-area-inset-bottom,1rem)] pt-4">
        <button
          type="button"
          onClick={onPay}
          className="w-full rounded-full bg-[#D95A3D] py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:brightness-95 active:scale-[0.98]"
        >
          Pay Now →
        </button>
        <p className="mt-3 text-center text-[11px] font-semibold text-[#7B7E9B]">
          You won&apos;t be charged until the vendor confirms
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MobilePaymentDock({ summary, onPay, isProcessing }: MobilePaymentDockProps) {
  const [open, setOpen] = useState(false);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      {/* ── Dock bar ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-20 z-40 border-t border-[#EFE8DE] bg-bg-primary px-5 py-4 shadow-[0_-8px_32px_rgba(34,27,18,0.08)]">
        <div className="flex items-center justify-between gap-4">

          {/* Venue + price — tappable trigger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="View booking summary"
            className="flex min-w-0 flex-col items-start gap-0.5 text-left"
          >
            {/* Venue name — truncated */}
            <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#555B7F]">
              <span className="max-w-[180px] truncate">{summary.venueName}</span>
              <ChevronUp className="h-3 w-3 shrink-0 text-[#B9401D]" />
            </span>
            {/* Total */}
            <span className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#252423]">{summary.total}</span>
              <span className="text-[11px] font-bold text-[#B9401D] underline underline-offset-2">
                See details
              </span>
            </span>
          </button>

          {/* Pay Now */}
          <button
            type="button"
            onClick={onPay}
             disabled={isProcessing}
            className="shrink-0 rounded-full bg-[#B9401D] px-8 py-4 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Pay Now →"}
          </button>
        </div>
      </div>

      {/* ── Summary sheet — portalled ────────────────────────────────────── */}
      {portalTarget && createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Scrim */}
              <motion.div
                key="scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]"
                aria-hidden="true"
              />

              {/* Sheet */}
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
                className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-8px_48px_rgba(36,28,18,0.18)]"
                style={{ maxHeight: "92dvh" }}
                onClick={(e) => e.stopPropagation()}
              >
                <SummarySheet
                  summary={summary}
                  onClose={() => setOpen(false)}
                  onPay={onPay}
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
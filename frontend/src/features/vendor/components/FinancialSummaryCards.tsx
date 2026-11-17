"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { FinancialSummary } from "../types";
import { EASE_OUT, clampPercent, formatCurrency, VENDOR_CARD } from "../utils";

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
  /** Jumps the bookings table to the Pending bucket. */
  onReviewPending?: () => void;
}

export function FinancialSummarySkeleton() {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-7 lg:gap-6">
      <div className="h-56 animate-pulse rounded-[1.75rem] bg-[#EFE7DE] lg:col-span-3" />
      <div className="grid grid-cols-2 gap-4 lg:col-span-4 lg:gap-6">
        <div className="h-56 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
        <div className="h-56 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
      </div>
    </section>
  );
}

export default function FinancialSummaryCards({
  summary,
  onReviewPending,
}: FinancialSummaryCardsProps) {
  const change = summary.totalRevenueChangePercent;
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const positive = (change ?? 0) >= 0;
  const paidOutPct =
    summary.totalRevenue > 0
      ? clampPercent((summary.totalPaidOut / summary.totalRevenue) * 100)
      : 0;

  return (
    <section className="grid grid-cols-1 gap-4 xs:gap-5 lg:grid-cols-7 lg:gap-6">
      {/*  Revenue hero
          Deep espresso rather than the app's navy ink: it sits within the
          cream / terracotta / gold family the rest of the product uses. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-[#2A211B] via-[#241C16] to-[#1B1410] p-6 text-white shadow-[0_18px_44px_rgba(36,28,18,0.24)] lg:col-span-3 xl:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(185,64,29,0.42),transparent_65%)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(201,153,58,0.28),transparent_65%)] blur-2xl"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/55">
              Total revenue
            </p>
            {hasChange && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                  positive
                    ? "bg-[#E8B44A]/15 text-[#E8B44A]"
                    : "bg-[#F08A6A]/15 text-[#F08A6A]"
                }`}
              >
                {positive ? (
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                )}
                {positive ? "+" : ""}
                {change}%
              </span>
            )}
          </div>

          <motion.p
            key={summary.totalRevenue}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="mt-4 font-man text-3xl font-black leading-none tracking-tight tabular-nums xs:text-4xl xl:text-[2.75rem]"
          >
            {formatCurrency(summary.totalRevenue, summary.currencySymbol)}
          </motion.p>
          <p className="mt-2.5 text-[11px] font-semibold leading-5 text-white/45">
            Net of 10% commission · cancelled &amp; refunded bookings excluded
          </p>

          {/* Paid-out progress */}
          <div className="mt-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${paidOutPct}%` }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
                className="h-full rounded-full bg-linear-to-r from-[#C9993A] to-[#E8B44A]"
              />
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {Math.round(paidOutPct)}% settled to your bank
            </p>
          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
                <Wallet className="h-3.5 w-3.5 text-[#E8B44A]" aria-hidden="true" />
                Paid out
              </span>
              <span className="text-sm font-extrabold tabular-nums text-bg-secondary xs:text-base">
                {formatCurrency(summary.totalPaidOut, summary.currencySymbol)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
                <LockKeyhole className="h-3.5 w-3.5 text-[#C9993A]" aria-hidden="true" />
                In escrow
              </span>
              <span className="text-sm font-extrabold tabular-nums text-[#E8B44A] xs:text-base">
                {formatCurrency(summary.inEscrow, summary.currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/*  Counts  */}
      <div className="grid grid-cols-2 gap-4 xs:gap-5 lg:col-span-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT }}
          className={`${VENDOR_CARD} flex flex-col p-5 xl:p-7`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9A9AAE]">
            Confirmed
          </p>
          <p className="mt-1 font-man text-2xl font-black tabular-nums text-[#252423] xl:text-3xl">
            {summary.confirmedBookings}
          </p>
          <p className="mt-1 text-tiny font-semibold text-[#9A9AAE]">
            Events locked in
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14, ease: EASE_OUT }}
          className={`${VENDOR_CARD} flex flex-col p-5 xl:p-7`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9A9AAE]">
            Pending
          </p>
          <p className="mt-1 font-man text-2xl font-black tabular-nums text-[#252423] xl:text-3xl">
            {summary.pendingBookings}
          </p>
          <p className="mt-1 text-tiny font-semibold leading-5 text-[#9A9AAE]">
            {summary.pendingBookingsNote}
          </p>
          {summary.pendingBookings > 0 && onReviewPending && (
            <button
              type="button"
              onClick={onReviewPending}
              className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-[#FFF1E6] px-3 py-1.5 text-[11px] font-extrabold text-[#B9401D] transition-all hover:brightness-95 active:scale-95"
            >
              Review
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
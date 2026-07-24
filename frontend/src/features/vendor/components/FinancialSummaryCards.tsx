import type { FinancialSummary } from "../types";
import { formatCurrency } from "../utils";

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
}

export default function FinancialSummaryCards({ summary }: FinancialSummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 xs:gap-5 lg:grid-cols-7 lg:gap-6">
      {/* Total revenue — the anchor card, 3/7 of the row on large screens */}
      <div className="animate-fade-up rounded-card bg-text-primary p-6 text-white shadow-card lg:col-span-3 xl:p-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Total Revenue</p>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 17L10 11L14 15L20 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 8H20V14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {summary.totalRevenueChangePercent}%
          </span>
        </div>
        <p className="mt-6 font-man text-4xl font-black tracking-tight xl:text-5xl">
          {formatCurrency(summary.totalRevenue, summary.currencySymbol)}
        </p>
        <p className="mt-3 text-sm text-white/50">vs. previous period</p>
      </div>

      {/* Confirmed + pending — share the remaining 4/7 of the row */}
      <div className="grid grid-cols-2 gap-4 xs:gap-5 lg:col-span-4 lg:gap-6">
        <div className="animate-fade-up rounded-card bg-bg-tertiary p-5 shadow-card [animation-delay:80ms] xl:p-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 12.5L11 14.5L15.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-text-primary/50">Confirmed</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="font-man text-2xl font-black text-text-primary xl:text-3xl">
              {summary.confirmedBookings}
            </p>
            <span className="text-xs font-bold text-emerald-600">+{summary.confirmedBookingsChangePercent}%</span>
          </div>
        </div>

        <div className="animate-fade-up rounded-card bg-bg-tertiary p-5 shadow-card [animation-delay:140ms] xl:p-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-text-primary/50">Pending</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="font-man text-2xl font-black text-text-primary xl:text-3xl">
              {summary.pendingBookings}
            </p>
          </div>
          <p className="mt-1 truncate text-[11px] text-text-primary/45">{summary.pendingBookingsNote}</p>
        </div>
      </div>
    </section>
  );
}
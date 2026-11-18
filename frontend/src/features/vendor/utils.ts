
export {
  WAT_TIME_ZONE,
  WAT_LABEL,
  formatDay,
  formatDayShort,
  formatDayLong,
  formatRelativeDay,
  formatWatDate,
  formatWatDateLong,
  formatWatTime,
  formatWatDateTime,
  formatWatDateTimeLabelled,
  formatClock,
  formatClockRange,
  formatEventTimeLabel,
  bookedSpans,
  spanLabel,
  spansLabel,
  allSpansLabel,
  countBookedDays,
} from "@/lib/datetime";

export type { DaySpan } from "@/lib/datetime";

import { formatWatDateTimeLabelled } from "@/lib/datetime";

/** Timestamps: "18 Nov 2026 · 09:24 WAT". */
export function formatTimestamp(value: string | null | undefined): string {
  return formatWatDateTimeLabelled(value);
}

export const VENDOR_CARD =
  "rounded-[1.75rem] border border-[#F0E9DF] bg-white shadow-[0_10px_30px_rgba(36,28,18,0.05)]";

/** Scrollbars drawn in the palette instead of the browser default. */
export const VENDOR_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function formatCurrency(value: number, symbol = "₦"): string {
  return `${symbol}${value.toLocaleString("en-NG")}`;
}

export function formatCompactCurrency(value: number, symbol = "₦"): string {
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value}`;
}

/** Exact money for receipts and payouts - always two decimals. */
export function naira(value: number): string {
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
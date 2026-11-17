import { addDays, dayKey, diffDays, toDay } from "@/features/search/utils/rangeSelection";

/**
 * Shared vendor surface language. Every card on the vendor pages uses the
 * same white surface, hairline border and soft warm shadow as the saved hub,
 * so the dashboard no longer reads as a different product.
 */
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

export function formatDay(value: string | null | undefined): string {
  const d = toDay(value ?? "");
  if (!d) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDayShort(value: string | null | undefined): string {
  const d = toDay(value ?? "");
  if (!d) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

/** Timestamps render on the 24-hour clock, matching the booking flow. */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "today" / "tomorrow" / "in 4 days" / "3 days ago" - for payout ETAs. */
export function formatRelativeDay(value: string | null | undefined): string {
  const d = toDay(value ?? "");
  if (!d) return "—";
  const today = toDay(new Date())!;
  const delta = diffDays(today, d);
  if (delta === 0) return "today";
  if (delta === 1) return "tomorrow";
  if (delta === -1) return "yesterday";
  return delta > 0 ? `in ${delta} days` : `${Math.abs(delta)} days ago`;
}

export interface DaySpan {
  from: Date;
  to: Date;
}

/**
 * Rebuild the contiguous booked spans from the stored envelope + the interior
 * days the customer removed. Mirrors Booking.resolveStay on the server, so the
 * vendor sees the dates actually booked - including single, non-adjacent days.
 */
export function bookedSpans(
  start: string | null | undefined,
  end: string | null | undefined,
  excluded: string[] = []
): DaySpan[] {
  const s = toDay(start ?? "");
  const e = toDay(end ?? start ?? "");
  if (!s || !e || e < s) return [];

  const holes = new Set<string>();
  for (const raw of excluded ?? []) {
    const d = toDay(raw);
    if (d) holes.add(dayKey(d));
  }

  const out: DaySpan[] = [];
  let segStart: Date | null = null;
  for (let cursor = s; cursor <= e; cursor = addDays(cursor, 1)) {
    if (holes.has(dayKey(cursor))) {
      if (segStart) {
        out.push({ from: segStart, to: addDays(cursor, -1) });
        segStart = null;
      }
    } else if (!segStart) {
      segStart = cursor;
    }
  }
  if (segStart) out.push({ from: segStart, to: e });
  return out;
}

export function spanLabel(span: DaySpan): string {
  return diffDays(span.from, span.to) === 0
    ? formatDay(dayKey(span.from))
    : `${formatDayShort(dayKey(span.from))} – ${formatDay(dayKey(span.to))}`;
}

export function spansLabel(spans: DaySpan[], max = 2): string {
  if (spans.length === 0) return "—";
  const parts = spans.slice(0, max).map(spanLabel);
  return parts.join(" · ") + (spans.length > max ? ` +${spans.length - max} more` : "");
}

export function countBookedDays(spans: DaySpan[]): number {
  return spans.reduce((total, span) => total + diffDays(span.from, span.to) + 1, 0);
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
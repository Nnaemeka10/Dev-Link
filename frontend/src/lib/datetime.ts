import { addDays, dayKey, diffDays, toDay } from "@/features/search/utils/rangeSelection";

/**
 * Single source of truth for date & time presentation.
 *
 * TWO DISTINCT KINDS OF VALUE
 *
 *  1. CALENDAR DAYS  ("2026-12-15")
 *     listings/bookings DATE columns. A day is not an instant: it has no
 *     timezone. These are parsed at LOCAL midnight (toDay) and formatted
 *     WITHOUT a timeZone, so they never shift. 
 *
 *  2. INSTANTS  ("2026-11-18T09:24:00.000Z")
 *     created_at / paid_at / cancelled_at / dispute_window_closes_at /
 *     ledger created_at. These are real moments and are ALWAYS rendered in
 *     West Africa Time with an explicit label, so a vendor abroad and the
 *     customer in Lagos read the same clock. It also makes SSR and client
 *     output identical (no hydration drift).
 *
 * formatDay/formatDayShort/formatDayLong discriminate on the shape of the
 * string, so every existing call site stays correct whichever kind it passes.
 *
 */

export const WAT_TIME_ZONE = "Africa/Lagos";
export const WAT_LABEL = "WAT";

/** Exactly a calendar day - anything else is treated as an instant. */
const DAY_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function intl(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-NG", options);
}

// hourCycle "h23" (not hour12:false) so midnight renders 00:xx, never 24:xx.
const WAT_DATE = intl({ timeZone: WAT_TIME_ZONE, day: "numeric", month: "short", year: "numeric" });
const WAT_DATE_LONG = intl({ timeZone: WAT_TIME_ZONE, day: "numeric", month: "long", year: "numeric" });
const WAT_TIME = intl({ timeZone: WAT_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const WAT_DAY_PARTS = intl({ timeZone: WAT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

const LOCAL_DATE = intl({ day: "numeric", month: "short", year: "numeric" });
const LOCAL_DATE_SHORT = intl({ day: "numeric", month: "short" });
const LOCAL_DATE_LONG = intl({ weekday: "short", day: "numeric", month: "long", year: "numeric" });

// ---------------------------------------------------------------------------
// Instants → West Africa Time
// ---------------------------------------------------------------------------

export function parseInstant(value: string | Date | null | undefined): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The WAT calendar day an instant falls on, as "YYYY-MM-DD". */
export function watDayKey(value: string | Date | null | undefined): string | null {
  const d = parseInstant(value);
  if (!d) return null;
  const parts = WAT_DAY_PARTS.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "18 Nov 2026" - the WAT day of an instant. */
export function formatWatDate(value: string | Date | null | undefined): string {
  const d = parseInstant(value);
  return d ? WAT_DATE.format(d) : "-";
}

/** "18 November 2026" - long form, for receipts. */
export function formatWatDateLong(value: string | Date | null | undefined): string {
  const d = parseInstant(value);
  return d ? WAT_DATE_LONG.format(d) : "-";
}

/** "09:24" - 24-hour WAT clock. */
export function formatWatTime(value: string | Date | null | undefined): string {
  const d = parseInstant(value);
  return d ? WAT_TIME.format(d) : "-";
}

/** "18 Nov 2026 · 09:24" - unlabelled, for tight rows that label WAT elsewhere. */
export function formatWatDateTime(value: string | Date | null | undefined): string {
  const d = parseInstant(value);
  return d ? `${WAT_DATE.format(d)} · ${WAT_TIME.format(d)}` : "-";
}

/** "18 Nov 2026 · 09:24 WAT" - the default for booked-on / paid-on everywhere. */
export function formatWatDateTimeLabelled(value: string | Date | null | undefined): string {
  const d = parseInstant(value);
  return d ? `${WAT_DATE.format(d)} · ${WAT_TIME.format(d)} ${WAT_LABEL}` : "-";
}

// ---------------------------------------------------------------------------
// Calendar days (no timezone conversion - a day is not an instant)
// ---------------------------------------------------------------------------

function isDayOnly(value: string): boolean {
  return DAY_ONLY_RE.test(value.trim());
}

/** "15 Dec 2026". Accepts a calendar day OR an instant (rendered in WAT). */
export function formatDay(value: string | null | undefined): string {
  if (!value) return "-";
  if (!isDayOnly(value)) return formatWatDate(value);
  const d = toDay(value);
  return d ? LOCAL_DATE.format(d) : "-";
}

/** "15 Dec". */
export function formatDayShort(value: string | null | undefined): string {
  if (!value) return "-";
  if (!isDayOnly(value)) {
    const d = parseInstant(value);
    if (!d) return "-";
    return intl({ timeZone: WAT_TIME_ZONE, day: "numeric", month: "short" }).format(d);
  }
  const d = toDay(value);
  return d ? LOCAL_DATE_SHORT.format(d) : "-";
}

/** "Mon, 15 December 2026". */
export function formatDayLong(value: string | null | undefined): string {
  if (!value) return "-";
  if (!isDayOnly(value)) return formatWatDateLong(value);
  const d = toDay(value);
  return d ? LOCAL_DATE_LONG.format(d) : "-";
}

/**
 * "today" / "tomorrow" / "in 4 days" / "3 days ago".
 * Compared on WAT calendar days so the ETA matches the payout job, not the
 * viewer's device timezone.
 */
export function formatRelativeDay(value: string | null | undefined): string {
  if (!value) return "-";
  const targetKey = isDayOnly(value) ? value.trim() : watDayKey(value);
  const todayKey = watDayKey(new Date());
  if (!targetKey || !todayKey) return "-";

  const target = toDay(targetKey);
  const today = toDay(todayKey);
  if (!target || !today) return "-";

  const delta = diffDays(today, target);
  if (delta === 0) return "today";
  if (delta === 1) return "tomorrow";
  if (delta === -1) return "yesterday";
  return delta > 0 ? `in ${delta} days` : `${Math.abs(delta)} days ago`;
}

// ---------------------------------------------------------------------------
// Event clock - TIME columns are wall-clock values, never timezone-shifted
// ---------------------------------------------------------------------------

/** "16:00:00" / "16:00" → "16:00". Null when unusable. */
export function formatClock(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value).trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${match[2]}`;
}

/** "16:00 – 23:00", a single endpoint, or "-" when neither exists. */
export function formatClockRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  const a = formatClock(start);
  const b = formatClock(end);
  if (a && b) return `${a} – ${b}`;
  return a ?? b ?? "-";
}

/** "16:00 – 23:00 WAT" - events are booked on Lagos wall-clock time. */
export function formatEventTimeLabel(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  const range = formatClockRange(start, end);
  return range === "-" ? "-" : `${range} ${WAT_LABEL}`;
}

// ---------------------------------------------------------------------------
// Split-range bookings (envelope + excluded interior days)
// ---------------------------------------------------------------------------

export interface DaySpan {
  from: Date;
  to: Date;
}

/**
 * Rebuild the contiguous booked spans from the stored envelope plus the
 * interior days the customer removed. Mirrors Booking.resolveStay on the
 * server, so every surface shows the dates ACTUALLY booked - including
 * single, non-adjacent days - instead of a misleading continuous range.
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

/** "10 Dec – 14 Dec 2026 · 16 Dec 2026 +1 more". */
export function spansLabel(spans: DaySpan[], max = 2): string {
  if (spans.length === 0) return "-";
  const parts = spans.slice(0, max).map(spanLabel);
  return parts.join(" · ") + (spans.length > max ? ` +${spans.length - max} more` : "");
}

/** Full list, no truncation - receipts must show every booked day. */
export function allSpansLabel(spans: DaySpan[]): string {
  if (spans.length === 0) return "-";
  return spans.map(spanLabel).join(" · ");
}

export function countBookedDays(spans: DaySpan[]): number {
  return spans.reduce((total, span) => total + diffDays(span.from, span.to) + 1, 0);
}
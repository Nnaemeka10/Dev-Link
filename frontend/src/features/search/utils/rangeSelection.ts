import type { DateRange } from "../types/search.types";

/** `to` undefined = pending start (user picked a start, waiting for an end). */
export type DayRange = DateRange;
export type BlockedRanges = { from: string; to: string }[];

const DAY_MS = 86_400_000;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const diffDays = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
export const parseDay = (s: string) => startOfDay(new Date(`${s.split("T")[0]}T00:00:00`));

/** Expand blocked ranges into a Set of day keys for O(1) lookups. */
export function toBlockedSet(ranges: BlockedRanges): Set<string> {
  const set = new Set<string>();
  for (const r of ranges) {
    for (let d = parseDay(r.from), end = parseDay(r.to); d <= end; d = addDays(d, 1)) {
      set.add(dayKey(d));
    }
  }
  return set;
}

export function firstBlockedBetween(from: Date, to: Date, blocked: Set<string>): Date | null {
  for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) {
    if (blocked.has(dayKey(d))) return d;
  }
  return null;
}

/** Hover preview: never paints past the first blocked day. */
export function previewRange(from: Date, hovered: Date, blocked: Set<string>) {
  if (hovered <= from) return null;
  const hit = firstBlockedBetween(from, hovered, blocked);
  const to = hit ? addDays(hit, -1) : hovered;
  return diffDays(from, to) >= 1 ? { from, to } : null;
}

/** Sort completed ranges, merge overlapping/adjacent ones. Pending start stays last. */
export function normalizeRanges(ranges: DayRange[]): DayRange[] {
  const completed = ranges
    .filter((r): r is { from: Date; to: Date } => !!r.to)
    .map((r) => ({ from: startOfDay(r.from), to: startOfDay(r.to) }))
    .sort((a, b) => a.from.getTime() - b.from.getTime());
  const open = ranges.find((r) => !r.to);

  const merged: { from: Date; to: Date }[] = [];
  for (const r of completed) {
    const last = merged[merged.length - 1];
    if (last && diffDays(last.to, r.from) <= 1) {
      if (r.to > last.to) last.to = r.to;
    } else {
      merged.push({ ...r });
    }
  }
  return open ? [...merged, { from: startOfDay(open.from) }] : merged;
}

/** Remove one day: drop / shrink / split. */
export function removeDay(ranges: DayRange[], day: Date): DayRange[] {
  const k = dayKey(startOfDay(day));
  const out: DayRange[] = [];
  for (const r of ranges) {
    if (!r.to) {
      if (dayKey(r.from) !== k) out.push(r);
      continue;
    }
    if (day < r.from || day > r.to) { out.push(r); continue; }
    if (diffDays(r.from, r.to) === 0) continue;                 // single day - gone
    if (dayKey(r.from) === k) out.push({ from: addDays(r.from, 1), to: r.to });
    else if (dayKey(r.to) === k) out.push({ from: r.from, to: addDays(r.to, -1) });
    else out.push({ from: r.from, to: addDays(day, -1) }, { from: addDays(day, 1), to: r.to });
  }
  return out;
}

/**
 * The one reducer every click goes through.
 * allowSplit=false - classic single-range mode (search), still block-safe.
 */
export function applyDayClick(
  ranges: DayRange[],
  rawDay: Date,
  blocked: Set<string>,
  allowSplit = true,
): DayRange[] {
  const day = startOfDay(rawDay);
  if (blocked.has(dayKey(day))) return ranges; // disabled in UI; belt & braces

  const open = ranges.find((r) => !r.to);
  const completed = ranges.filter((r): r is { from: Date; to: Date } => !!r.to);

  // 1. Clicked a selected day - remove it (multi) or restart here (single)
  if (completed.some((r) => day >= r.from && day <= r.to)) {
    return allowSplit ? removeDay(ranges, day) : [{ from: day }];
  }

  // 2. Second click on the pending start - single-day selection
  if (open && dayKey(open.from) === dayKey(day)) {
    return normalizeRanges([...completed, { from: day, to: day }]);
  }

  // 3. Completing a pending range
  if (open) {
    if (day < open.from) return [...completed, { from: day }]; // earlier click = new start
    if (firstBlockedBetween(open.from, day, blocked)) {
      return [...completed, { from: day }]; // Airbnb restart: never span blocked days
    }
    return normalizeRanges([...completed, { from: open.from, to: day }]);
  }

  // 4. Adjacent to an existing range - extend / re-merge the removed gap day
  if (allowSplit && completed.some((r) => diffDays(r.to, day) === 1 || diffDays(day, r.from) === 1)) {
    return normalizeRanges([...completed, { from: day, to: day }]);
  }

  // 5. Fresh pending start
  return allowSplit ? [...completed, { from: day }] : [{ from: day }];
}

/** Commit pending starts as single-day ranges (used on Apply). */
export function finalizeRanges(ranges: DayRange[]): { from: Date; to: Date }[] {
  return normalizeRanges(ranges.map((r) => (r.to ? r : { from: r.from, to: r.from })))
    .filter((r): r is { from: Date; to: Date } => !!r.to);
}

export function countSelectedDays(ranges: DayRange[]): number {
  return ranges.reduce((n, r) => n + (r.to ? diffDays(r.from, r.to) + 1 : 1), 0);
}

/** Envelope for the existing single-range quote/booking contract. */
export function envelope(ranges: DayRange[]): DateRange | undefined {
  const done = finalizeRanges(ranges);
  if (!done.length) return undefined;
  return { from: done[0].from, to: done[done.length - 1].to };
}

/** Interior gap days - what the backend must NOT charge for or block. */
export function excludedDates(ranges: DayRange[]): string[] {
  const done = finalizeRanges(ranges);
  const out: string[] = [];
  for (let i = 1; i < done.length; i++) {
    for (let d = addDays(done[i - 1].to, 1); d < done[i].from; d = addDays(d, 1)) {
      out.push(dayKey(d));
    }
  }
  return out;
}
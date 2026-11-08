import type { SearchCategory } from "../types/search.types";

const KEY = "eventvnv:last-search";

export interface LastSearchSnapshot {
  category: SearchCategory;
  location?: string;
  coverageArea?: string;
  dateRange?: { from: string; to?: string };
  capacity?: number;
  role?: string;
  flexible?: number;
}

interface SaveInput {
  category: SearchCategory;
  location?: string;
  coverageArea?: string;
  dateRange?: { from: Date | string; to?: Date | string };
  capacity?: number;
  role?: string;
  flexible?: number;
}

const iso = (d: Date | string) => (d instanceof Date ? d.toISOString() : d);

export function saveLastSearch(input: SaveInput): void {
  if (typeof window === "undefined") return;
  try {
    const snapshot: LastSearchSnapshot = {
      category: input.category,
      location: input.location || undefined,
      coverageArea: input.coverageArea || undefined,
      dateRange: input.dateRange
        ? {
            from: iso(input.dateRange.from),
            ...(input.dateRange.to ? { to: iso(input.dateRange.to) } : {}),
          }
        : undefined,
      capacity: input.capacity,
      role: input.role,
      flexible: input.flexible ?? 0,
    };
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* private mode / quota - non-fatal */
  }
}

export function loadLastSearch(): LastSearchSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastSearchSnapshot;
    return parsed?.category === "halls" || parsed?.category === "services"
      ? parsed
      : null;
  } catch {
    return null;
  }
}
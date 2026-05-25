/**
 * Single source of truth for converting between:
 * - URLSearchParams
 * - SearchState (Zustand)
 * - Form data
 *
 * Philosophy: Consolidates all search param handling to prevent duplication bugs.
 * Replaces: buildSearchParams, buildSearchString, normalizeListingSearchParams, buildListingsHref
 */

import type { SearchState } from "../types/search.types";

interface RawSearchParams {
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  capacity?: string;
  role?: string;
}

/**
 * Parse raw URL search params into SearchState
 * Called by useSearchUrlSync and buildListingsHref
 * Handles validation and type coercion
 */
export function parseSearchParams(raw: RawSearchParams): Partial<SearchState> {
  const state: Partial<SearchState> = {};

  // Category (required, defaults to halls)
  state.category = raw.category === "services" ? "services" : "halls";

  // Location (halls only, must be non-empty string)
  if (state.category === "halls" && typeof raw.location === "string") {
    const trimmed = raw.location.replace(/[<>"'`]/g, "").trim();
    if (trimmed.length >= 2) state.location = trimmed;
  }

  // Date range (optional)
  if (typeof raw.dateFrom === "string") {
    const dateFrom = new Date(raw.dateFrom);
    if (!isNaN(dateFrom.getTime())) {
      state.dateRange = { from: dateFrom };

      if (typeof raw.dateTo === "string") {
        const dateTo = new Date(raw.dateTo);
        if (!isNaN(dateTo.getTime()) && dateTo >= dateFrom) {
          state.dateRange.to = dateTo;
        }
      }
    }
  }

  // Capacity (halls only, must be >= 1)
  if (state.category === "halls" && typeof raw.capacity === "string") {
    const capacity = parseInt(raw.capacity, 10);
    if (!isNaN(capacity) && capacity >= 1) {
      state.capacity = capacity;
    }
  }

  // Role (services only, must be non-empty string)
  if (state.category === "services" && typeof raw.role === "string") {
    const trimmed = raw.role.replace(/[<>"'`]/g, "").trim();
    if (trimmed.length >= 1) state.role = trimmed;
  }

  return state;
}

/**
 * Serialize SearchState to URL-safe query string
 * Called by form submission and any component that navigates to /listings
 * Omits undefined values; respects category constraints
 */
export function buildSearchString(state: Partial<SearchState>): string {
  return buildSearchParams(state).toString();
}

/**
 * Serialize SearchState to URLSearchParams object
 * Lower-level utility for buildSearchString
 */
export function buildSearchParams(state: Partial<SearchState>): URLSearchParams {
  const params = new URLSearchParams();

  // Category (always required)
  if (state.category) {
    params.set("category", state.category);
  }

  // Location (halls only)
  if (state.category === "halls" && state.location?.trim()) {
    params.set("location", state.location.trim());
  }

  // Date range (both or neither)
  if (state.dateRange?.from) {
    params.set("dateFrom", state.dateRange.from.toISOString());
    if (state.dateRange.to) {
      params.set("dateTo", state.dateRange.to.toISOString());
    }
  }

  // Capacity (halls only, must be >= 1)
  if (state.category === "halls" && state.capacity !== undefined && state.capacity >= 1) {
    params.set("capacity", state.capacity.toString());
  }

  // Role (services only)
  if (state.category === "services" && state.role?.trim()) {
    params.set("role", state.role.trim());
  }

  return params;
}

/**
 * Build full /listings URL from SearchState
 * Single source for all navigation to listings page
 */
export function buildListingsUrl(state: Partial<SearchState>): string {
  const queryString = buildSearchString(state);
  return `/listings${queryString ? `?${queryString}` : ""}`;
}

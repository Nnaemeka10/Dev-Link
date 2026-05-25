import type { SearchState } from "../types/search.types";

/**
 * Build URL search params from SearchState
 * Used when submitting search to navigate to listings
 * Omits undefined values and respects category constraints
 */
export function buildSearchParams(state: Partial<SearchState>): Record<string, string> {
  const params: Record<string, string> = {};

  // Category (always include)
  if (state.category) {
    params.category = state.category;
  }

  // Location (only for halls)
  if (state.category === "halls" && state.location?.trim()) {
    params.location = state.location.trim();
  }

  // Date range
  if (state.dateRange?.from) {
    params.dateFrom = state.dateRange.from.toISOString();
    if (state.dateRange.to) {
      params.dateTo = state.dateRange.to.toISOString();
    }
  }

  // Capacity (only for halls)
  if (state.category === "halls" && state.capacity !== undefined && state.capacity >= 1) {
    params.capacity = state.capacity.toString();
  }

  // Role (only for services)
  if (state.category === "services" && state.role?.trim()) {
    params.role = state.role.trim();
  }

  return params;
}

/**
 * Build URL search string from SearchState
 * Convenience wrapper around buildSearchParams
 */
export function buildSearchString(state: Partial<SearchState>): string {
  const params = buildSearchParams(state);
  const query = new URLSearchParams(params);
  return query.toString();
}

import type { SearchState } from "../types/search.types";

/**
 * Parse URL search params into SearchState
 * Used for Listings page to hydrate store from URL
 */
export function parseSearchParams(searchParams: Record<string, string | string[] | undefined>): Partial<SearchState> {
  const state: Partial<SearchState> = {
    category: "halls", // default
  };

  // Category
  if (searchParams.category === "halls" || searchParams.category === "services") {
    state.category = searchParams.category;
  }

  // Location (only for halls)
  if (state.category === "halls" && typeof searchParams.location === "string" && searchParams.location.trim()) {
    state.location = searchParams.location.trim();
  }

  // Date range
  if (typeof searchParams.dateFrom === "string" && searchParams.dateFrom.trim()) {
    const dateFrom = new Date(searchParams.dateFrom);
    if (!isNaN(dateFrom.getTime())) {
      state.dateRange = { from: dateFrom };

      if (typeof searchParams.dateTo === "string" && searchParams.dateTo.trim()) {
        const dateTo = new Date(searchParams.dateTo);
        if (!isNaN(dateTo.getTime())) {
          state.dateRange.to = dateTo;
        }
      }
    }
  }

  // Capacity (only for halls)
  if (state.category === "halls" && typeof searchParams.capacity === "string") {
    const capacity = parseInt(searchParams.capacity, 10);
    if (!isNaN(capacity) && capacity >= 1) {
      state.capacity = capacity;
    }
  }

  // Role (only for services)
  if (state.category === "services" && typeof searchParams.role === "string" && searchParams.role.trim()) {
    state.role = searchParams.role.trim();
  }

  return state;
}

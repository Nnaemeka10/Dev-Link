import type { SearchState } from "../types/search.types";

interface RawSearchParams {
  category?: string;
  location?: string;
  coverage?: string;
  dateFrom?: string;
  dateTo?: string;
  capacity?: string;
  role?: string;
  flexible?: string;
}

const sanitizeText = (value: string | undefined) =>
  value ? value.replace(/[<>"'`]/g, "").trim() || undefined : undefined;

export function parseSearchParams(raw: RawSearchParams): Partial<SearchState> {
  const state: Partial<SearchState> = {
    category: raw.category === "services" ? "services" : "halls",
  };

  if (state.category === "halls") {
    state.location = sanitizeText(raw.location) ?? "";
  } else {
    state.coverageArea = sanitizeText(raw.coverage) ?? "";
  }

  if (raw.dateFrom) {
    const dateFrom = new Date(raw.dateFrom);
    if (!isNaN(dateFrom.getTime())) {
      state.dateRange = { from: dateFrom };
      if (raw.dateTo) {
        const dateTo = new Date(raw.dateTo);
        if (!isNaN(dateTo.getTime()) && dateTo >= dateFrom) state.dateRange.to = dateTo;
      }
    }
  }

  if (state.category === "halls" && raw.capacity) {
    const capacity = parseInt(raw.capacity, 10);
    if (!isNaN(capacity) && capacity >= 1) state.capacity = capacity;
  }

  if (state.category === "services") {
    state.role = sanitizeText(raw.role);
  }

  const flexible = parseInt(raw.flexible ?? "0", 10);
  state.flexible = flexible === 1 || flexible === 2 ? flexible : 0;

  return state;
}

export function buildSearchParams(state: Partial<SearchState>): URLSearchParams {
  const params = new URLSearchParams();

  if (state.category) params.set("category", state.category);

  if (state.category === "halls" && state.location?.trim()) {
    params.set("location", state.location.trim());
  }
  if (state.category === "services" && state.coverageArea?.trim()) {
    params.set("coverage", state.coverageArea.trim());
  }

  if (state.dateRange?.from) {
    params.set("dateFrom", state.dateRange.from.toISOString());
    if (state.dateRange.to) params.set("dateTo", state.dateRange.to.toISOString());
    if (state.flexible) params.set("flexible", String(state.flexible));
  }

  if (state.category === "halls" && state.capacity !== undefined && state.capacity >= 1) {
    params.set("capacity", String(state.capacity));
  }
  if (state.category === "services" && state.role?.trim()) {
    params.set("role", state.role.trim());
  }

  return params;
}

export function buildSearchString(state: Partial<SearchState>): string {
  return buildSearchParams(state).toString();
}

export function buildListingsUrl(state: Partial<SearchState>): string {
  const qs = buildSearchString(state);
  return qs ? `/listings?${qs}` : "/listings";
}
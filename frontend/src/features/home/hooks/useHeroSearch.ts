"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api" // adjust to your actual path
import { useDebounce } from "@/hooks/useDebounce"; // adjust to your actual path

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationSuggestion {
  id: string;
  name: string;
  state: string;
}

export interface SearchResult {
  id: string;
  name: string;
  category: "halls" | "services";
  location: string;
  date?: string;
}

export interface SearchPayload {
  results: SearchResult[];
  total: number;
}

// ─── Location Autocomplete ─────────────────────────────────────────────────────

/**
 * Fires while the user is still typing in the "Where" field.
 * Debounced to 350ms so we don't hammer the server on every keystroke.
 */
export function useLocationSuggestions(rawQuery: string) {
  const query = useDebounce(rawQuery.trim(), 350);

  return useQuery<LocationSuggestion[]>({
    queryKey: ["location-suggestions", query],
    queryFn: () =>
      apiFetch<LocationSuggestion[]>(
        `/api/locations/suggest?q=${encodeURIComponent(query)}`
      ),
    // Don't fire until the user has typed at least 2 chars
    enabled: query.length >= 2,
    // Suggestions can stay fresh for 2 minutes — they rarely change
    staleTime: 1000 * 60 * 2,
    // Keep previous results visible while the new fetch is in-flight
    // so the dropdown doesn't flash empty
    placeholderData: (prev) => prev,
  });
}

// ─── Full Search (on Submit) ───────────────────────────────────────────────────

export interface SearchParams {
  category: "halls" | "services";
  location: string;
  date?: string; // ISO string, e.g. "2025-12-01"
}

/**
 * Only fires when `enabled` is true (i.e. the user clicked "Search").
 * We gate it with a `searchKey` counter so clicking Search twice
 * with the same values still re-fetches.
 */
export function useSearch(params: SearchParams, searchKey: number) {
  return useQuery<SearchPayload>({
    queryKey: ["search", params, searchKey],
    queryFn: () => {
      const qs = new URLSearchParams({
        category: params.category,
        location: params.location,
        ...(params.date ? { date: params.date } : {}),
      });
      return apiFetch<SearchPayload>(`/api/search?${qs.toString()}`);
    },
    enabled: searchKey > 0 && params.location.trim().length > 0,
    staleTime: 1000 * 30, // search results go stale after 30s
    gcTime: 1000 * 60 * 5,
  });
}
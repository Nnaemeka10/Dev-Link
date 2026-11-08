"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

export interface LocationSuggestion {
  id: string;
  name: string;
  type: "state" | "lga";
  state: string;
  stateId: string;
}

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export function useLocationSuggestions(rawQuery: string) {
  const trimmed = rawQuery.trim();
  const query = useDebounce(trimmed, DEBOUNCE_MS);

  const results = useQuery<LocationSuggestion[]>({
    queryKey: ["location-suggestions", query],
    queryFn: () =>
      apiFetch<LocationSuggestion[]>(`/api/locations/suggest?q=${encodeURIComponent(query)}`),
    enabled: query.length >= MIN_QUERY_LENGTH,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  // True while the user is still typing and the debounced query hasn't caught
  // up yet. Consumers use it to keep showing a loading state (instead of a
  // false "No matches") during the debounce window.
  const isDebouncing = query !== trimmed && trimmed.length >= MIN_QUERY_LENGTH;

  return { ...results, isDebouncing };
}
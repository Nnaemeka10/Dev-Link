"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface NigeriaStateOption {
  id: string;
  name: string;
}

export interface NigeriaLgaOption {
  id: string;
  name: string;
  stateId: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const nigeriaLocationsKeys = {
  states: ["locations", "states"] as const,
  lgas: (stateId: string) => ["locations", "lgas", stateId] as const,
};

/**
 * Shared query options so a single-state dropdown (`useNigeriaLgas`) and a
 * multi-state batch (`useQueries` in the create-listing coverage picker)
 * hit the SAME cache entry. One fetch per state, ever, per day.
 */
export function nigeriaLgasQuery(stateId: string) {
  return {
    queryKey: nigeriaLocationsKeys.lgas(stateId),
    queryFn: () =>
      apiFetch<NigeriaLgaOption[]>(`/api/locations/states/${stateId}/lgas`, {
        method: "GET",
      }),
    staleTime: DAY_MS,
    gcTime: DAY_MS,
    retry: 2,
  };
}

/**
 * National directory hooks backed by /api/locations (migration 033 seeded
 * all 774 LGAs). Shared by the booking event-location form and the
 * create-listing wizard so both read the SAME ids the publish/booking
 * APIs resolve against - no hardcoded subsets that drift from the DB.
 */
export function useNigeriaStates() {
  return useQuery({
    queryKey: nigeriaLocationsKeys.states,
    queryFn: () =>
      apiFetch<NigeriaStateOption[]>("/api/locations/states", { method: "GET" }),
    staleTime: DAY_MS,
    gcTime: DAY_MS,
    retry: 2,
  });
}

export function useNigeriaLgas(stateId: string | null | undefined) {
  return useQuery({
    ...nigeriaLgasQuery(stateId ?? ""),
    enabled: !!stateId,
  });
}
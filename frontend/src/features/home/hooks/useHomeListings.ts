"use client";

import { useQuery } from "@tanstack/react-query";
import { getHomeListings, homeListingsQueryKey } from "../lib/listings.api";

export function useHomeListings() {
  return useQuery({
    queryKey: homeListingsQueryKey,
    queryFn: getHomeListings,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });
}

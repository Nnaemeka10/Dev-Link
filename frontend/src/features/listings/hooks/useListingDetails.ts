import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ListingDetailsResponse } from "../details.types";

export function useListingDetails(id: string) {
  return useQuery({
    queryKey: ["listing", "details", id],
    queryFn: async () => {
      const data = await apiFetch<ListingDetailsResponse>(`/api/listings/${id}`, {
        method: "GET",
        redirectOn401: false,
      });
      return data ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
}
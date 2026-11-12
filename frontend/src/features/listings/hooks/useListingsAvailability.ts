import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useListingAvailability(listingId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["listing", "availability", listingId],
    queryFn: async () => {
      const data = await apiFetch<{ unavailableDates: { from: string; to: string }[] }>(
        `/api/listings/${listingId}/availability`,
        { method: "GET", redirectOn401: false }
      );
      return data.unavailableDates;
    },
    enabled: enabled && !!listingId,
    staleTime: 0, // volatile data - always treat as stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    // Live hold greying: poll while the picker is open so other users'
    // holds appear/disappear without reopening the calendar.
    refetchInterval: enabled && !!listingId ? 15_000 : false,
  });
}
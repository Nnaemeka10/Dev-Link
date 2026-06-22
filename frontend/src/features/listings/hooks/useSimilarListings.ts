import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ListingCardSmall } from "../details.types";

export function useSimilarListings({ city, kind, excludeId, limit = 3 }: { 
    city?: string; 
    kind?: string; 
    excludeId?: string; 
    limit?: number 
} = {}) {
  return useQuery({
    queryKey: ["listings", "similar", city, kind, excludeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (kind) params.set("kind", kind);
      if (excludeId) params.set("id", excludeId);
      if (limit) params.set("limit", String(limit));

      const data = await apiFetch<ListingCardSmall[]>(`/api/listings/similar?${params.toString()}`);
      return data ?? [];
    },
    enabled: !!(city && kind && excludeId),
    staleTime: 1000 * 60 * 5,
  });
};
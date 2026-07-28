import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DateRange } from "@/features/search/utils/searchSchema";
import { toLocalDateString } from "@/lib/dates";

interface QuoteResponse {
  days: number;
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
}

export function usePricingQuote(listingId: string, dateRange: DateRange | undefined, packageId?: string) {
  return useQuery({
    queryKey: ["pricing-quote", listingId, dateRange?.from, dateRange?.to, packageId],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return null;

      const data = await apiFetch<QuoteResponse>("/api/bookings/quote", {
        method: "POST",
        body: JSON.stringify({
          listingId,
          startDate: toLocalDateString(dateRange.from),
          endDate: toLocalDateString(dateRange.to),
          packageId,
        }),
        redirectOn401: false,
      });
      return data;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 1000 * 60 * 5, // Cache quote for 5 mins
  });
}
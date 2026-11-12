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

/**
 * `dateRange` is the envelope (min start - max end). `excludedDates` are the
 * interior days the customer deselected - the backend subtracts them from
 * the day count, so the quote is honest for split ranges.
 * The 4th param is optional: existing single-range callers are unaffected.
 */
export function usePricingQuote(
  listingId: string,
  dateRange: DateRange | undefined,
  packageId?: string,
  excludedDates?: string[],
) {
  // Sorted join so toggling holes in a different order hits the same cache entry.
  const excludedKey = excludedDates?.length ? [...excludedDates].sort().join(",") : "";

  return useQuery({
    queryKey: ["pricing-quote", listingId, dateRange?.from, dateRange?.to, packageId, excludedKey],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return null;

      const data = await apiFetch<QuoteResponse>("/api/bookings/quote", {
        method: "POST",
        body: JSON.stringify({
          listingId,
          startDate: toLocalDateString(dateRange.from),
          endDate: toLocalDateString(dateRange.to),
          packageId,
          excludedDates: excludedDates ?? [],
        }),
        redirectOn401: false,
      });
      return data;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 1000 * 60 * 5, // Cache quote for 5 mins
  });
}
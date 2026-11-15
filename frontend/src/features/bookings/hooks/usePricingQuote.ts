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
  /** 10% of subtotal - the platform's commission. */
  commission: number;
  /** subtotal − commission - what the vendor receives. */
  vendorNet: number;
}

/**
 * `dateRange` is the envelope (min start – max end). `excludedDates` are the
 * interior days the customer deselected - the backend subtracts them from the
 * day count, so the quote is honest for split ranges.
 *
 * Always read commission/vendorNet from here rather than applying a rate in
 * the UI: modules/payments/utils/money.ts is the single source of truth.
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

      return apiFetch<QuoteResponse>("/api/bookings/quote", {
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
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 1000 * 60 * 5,
  });
}
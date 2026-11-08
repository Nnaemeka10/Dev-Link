import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchStore } from "../store/useSearchStore";
import { parseSearchParams } from "../utils/searchParamsConverter";
import { saveLastSearch } from "../lib/lastSearch";

/** URL - Store. Use ONLY on the Listings page. URL is the source of truth. */
export function useSearchUrlSync() {
  const searchParams = useSearchParams();
  const hydrateFromUrl = useSearchStore((state) => state.hydrateFromUrl);
  const resetParams = useSearchStore((state) => state.resetParams);

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (Object.keys(params).length > 0) {
      const parsed = parseSearchParams(params);
      hydrateFromUrl(parsed);
      // Landing on /listings with params counts as "last search" too, so
      // shared links / back navigation restore the hero bar.
      saveLastSearch({
        category: parsed.category ?? "halls",
        location: parsed.location,
        coverageArea: parsed.coverageArea,
        dateRange: parsed.dateRange,
        capacity: parsed.capacity,
        role: parsed.role,
        flexible: parsed.flexible,
      });
    } else {
      resetParams();
    }
  }, [searchParams, hydrateFromUrl, resetParams]);
}
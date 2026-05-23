import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchStore } from "../store/useSearchStore";
import { parseSearchParams } from "../utils/searchParamsConverter";

/**
 * URL → Store sync. Use ONLY on the Listings page.
 *
 * Philosophy: URL is the source of truth on the Listings page.
 *   - URL has params  → parse & hydrate store
 *   - URL has no params → reset store (fresh search)
 *
 * Must be called before any component tries to read from store.
 * Wrap in Suspense as done in ExploreMarketplace.
 */
export function useSearchUrlSync() {
  const searchParams = useSearchParams();
  const hydrateFromUrl = useSearchStore((state) => state.hydrateFromUrl);
  const resetParams = useSearchStore((state) => state.resetParams);

  useEffect(() => {
    // Convert URLSearchParams to plain object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // If URL has search params, parse and hydrate; otherwise reset
    if (Object.keys(params).length > 0) {
      hydrateFromUrl(parseSearchParams(params));
    } else {
      resetParams();
    }
  }, [searchParams, hydrateFromUrl, resetParams]);
}
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CursorPaginationMeta, CursorPaginatedResponse, HomeListingCard } from "../listings.types";
import type { ExploreListing, ExploreListingKind } from "../explore.types";

/**
 * 12 items per page: whole rows on the 2-col tablet and 3-col desktop grids,
 * ~15–25KB payloads, single-digit-ms keyset pages server-side.
 */
export const EXPLORE_PAGE_SIZE = 12;

export interface ExploreListingsParams {
  kind: "hall" | "service";
  coverage?: string;
  flexible?: number;
  location?: string;
  capacity?: number;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  sortOrder?: string;
  priceMin?: number;
  priceMax?: number;
  capacityMin?: number;
  capacityMax?: number;
  minRating?: number;
  verified?: boolean;
  venueTypes?: string[];
  amenities?: string[];
  role?: string;
}

export interface ExploreListingsPage {
  data: ExploreListing[];
  pagination: CursorPaginationMeta;
}

type ExploreFilters = Omit<ExploreListingsParams, "kind">;

function toExploreListing(item: HomeListingCard, kind: ExploreListingKind): ExploreListing {
  return {
    id: item.id,
    name: item.title,
    location: item.location,
    priceFrom: item.priceFrom,
    priceUnit: item.priceUnit,
    rating: item.rating,
    imageUrl: item.primaryImage?.thumbnailUrl ?? item.primaryImage?.url ?? null,
    kind,
    badges: item.badges ?? [],
    verified: item.verified ?? false,
    capacity: item.capacity ?? null,
    hallTypes: item.hallTypes ?? [],
  };
}

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Trim every token and sort the set, so ["wifi","parking"] and ["parking","wifi"]
 * hash to the SAME query key and one cache entry, no duplicate fetch when pills
 * are toggled in a different order.
 */
function cleanList(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  const cleaned = values.map((value) => value.trim()).filter(Boolean).sort();
  return cleaned.length > 0 ? cleaned : undefined;
}

function positiveNumber(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Last line of defence before the request, and it runs BEFORE the query key is
 * built so padded / NaN / empty URL values collapse to one canonical key instead
 * of spawning shadow caches.
 *
 * `kind` is authoritative: the publish flow only writes listing_features and
 * capacity for halls, so hall-only filters are dropped on the services tab even
 * if a stale URL (tab switch, shared link) still carries them.
 */
function normalizeFilters(kind: "hall" | "service", params: ExploreFilters): ExploreFilters {
  const isHall = kind === "hall";
  const sortOrder = cleanText(params.sortOrder)?.toLowerCase();

  return {
    ...params,
    coverage: isHall ? undefined : cleanText(params.coverage),
    location: isHall ? cleanText(params.location) : undefined,
    role: isHall ? undefined : cleanText(params.role),
    sort: cleanText(params.sort),
    sortOrder: sortOrder === "asc" ? "asc" : sortOrder ? "desc" : undefined,
    venueTypes: isHall ? cleanList(params.venueTypes) : undefined,
    amenities: isHall ? cleanList(params.amenities) : undefined,
    capacity: isHall ? positiveNumber(params.capacity) : undefined,
    capacityMin: isHall ? positiveNumber(params.capacityMin) : undefined,
    capacityMax: isHall ? positiveNumber(params.capacityMax) : undefined,
    priceMin: positiveNumber(params.priceMin),
    priceMax: positiveNumber(params.priceMax),
    minRating: positiveNumber(params.minRating),
    flexible: params.flexible === 1 || params.flexible === 2 ? params.flexible : undefined,
    verified: params.verified ? true : undefined,
  };
}

/**
 * Cursor-paginated explore feed.
 *
 * SORT + FILTER CONTRACT
 * - `sort`, `sortOrder` and every filter are part of the query key. Changing any
 *   of them creates a brand-new cache entry: all loaded pages are discarded,
 *   skeletons show, and page one is fetched with cursor=null. The cursor lives
 *   only inside React Query's page params and never in the URL or component state,
 *   so it cannot leak across filter sets.
 * - Each ordering mints its own cursor shape server-side (price carries
 *   priceFrom, reviews carries reviewCount, rating carries rating+count).
 *   Because pages reset on sort change the cursor always matches the active
 *   ORDER BY; decodeCursor(cursor, sort) additionally rejects a mismatch to null
 *   as defense in depth.
 * - `getNextPageParam` hands the server's opaque nextCursor straight back and the
 *   client never constructs or interprets it.
 * - No `maxPages`: the compare tray references rows from earlier pages, so every
 *   loaded page must stay materialized while the query is mounted.
 * - `refetchOnWindowFocus: false`: an infinite query refetches EVERY loaded page
 *   on focus by default, turning a tab-switch into N requests.
 * - gcTime keeps visited pages warm so back-navigation from a detail page
 *   restores the full scrolled list under the same filters.
 */
export function useExploreListings(params: ExploreListingsParams) {
  const { kind, ...rest } = params;
  const filters = normalizeFilters(kind, rest);

  const query = useInfiniteQuery({
    queryKey: ["explore", kind, filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<ExploreListingsPage> => {
      const search = new URLSearchParams();
      search.set("kind", kind);
      search.set("limit", String(EXPLORE_PAGE_SIZE));
      if (pageParam) search.set("cursor", pageParam);

      if (filters.coverage) search.set("coverage", filters.coverage);
      if (filters.flexible) search.set("flexible", String(filters.flexible));
      if (filters.location) search.set("location", filters.location);
      if (filters.capacity) search.set("capacity", String(filters.capacity));
      if (filters.dateFrom) search.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) search.set("dateTo", filters.dateTo);
      if (filters.sort) search.set("sort", filters.sort);
      if (filters.sortOrder) search.set("sortOrder", filters.sortOrder);
      if (filters.role) search.set("role", filters.role);
      if (filters.priceMin) search.set("priceMin", String(filters.priceMin));
      if (filters.priceMax) search.set("priceMax", String(filters.priceMax));
      if (filters.capacityMin) search.set("capacityMin", String(filters.capacityMin));
      if (filters.capacityMax) search.set("capacityMax", String(filters.capacityMax));
      if (filters.minRating) search.set("minRating", String(filters.minRating));
      if (filters.verified) search.set("verified", "true");
      if (filters.venueTypes?.length) search.set("venueTypes", filters.venueTypes.join(","));
      if (filters.amenities?.length) search.set("amenities", filters.amenities.join(","));

      const response = await apiFetch<CursorPaginatedResponse<HomeListingCard>>(
        `/api/listings?${search.toString()}`,
        { method: "GET", redirectOn401: false },
      );

      const mappedKind: ExploreListingKind = kind === "hall" ? "venue" : "service";
      return {
        data: response.data.map((item) => toExploreListing(item, mappedKind)),
        pagination: response.pagination,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor ?? undefined : undefined,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  /**
   * Flatten pages once per data change. The Set guard is cheap insurance:
   * keyset pagination is stable, but a listing edited between two page fetches
   * (its rating changed mid-scroll) can drift across the cursor boundary -
   * deduping by id guarantees React keys never collide.
   */
  const listings = useMemo(() => {
    const seen = new Set<string>();
    const flat: ExploreListing[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const item of page.data) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          flat.push(item);
        }
      }
    }
    return flat;
  }, [query.data]);

  return { ...query, listings };
}
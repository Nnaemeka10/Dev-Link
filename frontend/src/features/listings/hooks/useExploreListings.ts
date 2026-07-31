import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CursorPaginatedResponse, HomeListingCard } from "../listings.types";
import type { ExploreListing, ExploreListingKind } from "../explore.types";

export interface ExploreListingsParams {
    kind: "hall" | "service";
    location?: string;
    capacity?: number;
    dateFrom?: string;
    dateTo?: string;
    cursor?: string;
    sort?: string;
    sortOrder?: string;
}

// Helper to map Backend Data to Explore Card Data
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
    verified: false, // Backend doesn't return 'verified' flag on the list view yet, default to false
    capacity: item.capacity ?? null,
    hallTypes: item.hallTypes ?? [], 
  };
}

export function useExploreListings(params: ExploreListingsParams) {
  const { kind, ...searchParams } = params;

  return useQuery({
    queryKey: ["explore", kind, searchParams],
    queryFn: async () => {
      const search = new URLSearchParams();
            search.set("kind", kind);
            search.set("limit", "24");

            if (searchParams.location) search.set("location", searchParams.location);
            if (searchParams.capacity) search.set("capacity", String(searchParams.capacity));
            if (searchParams.dateFrom) search.set("dateFrom", searchParams.dateFrom);
            if (searchParams.dateTo) search.set("dateTo", searchParams.dateTo);
            if (searchParams.sort) search.set("sort", searchParams.sort);
            if (searchParams.sortOrder) search.set("sortOrder", searchParams.sortOrder);
            if (searchParams.cursor) search.set("cursor", searchParams.cursor);

            const response = await apiFetch<CursorPaginatedResponse<HomeListingCard>>(
                `/api/listings?${search.toString()}`,
                { method: "GET", redirectOn401: false }
            );

            const mappedKind: ExploreListingKind = kind === "hall" ? "venue" : "service";
            return {
                data: response.data.map((item) => toExploreListing(item, mappedKind)),
                pagination: response.pagination,
            };
        },
        staleTime: 1000 * 60 * 3,
        gcTime: 1000 * 60 * 5,
  });
}
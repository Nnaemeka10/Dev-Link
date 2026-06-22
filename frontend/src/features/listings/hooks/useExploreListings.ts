import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CursorPaginatedResponse, HomeListingCard } from "../listings.types";
import type { ExploreListing, ExploreListingKind } from "../explore.types";

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
  };
}

export function useExploreListings(kind: "hall" | "service") {
  return useQuery({
    queryKey: ["explore", kind],
    queryFn: async () => {
      // Reusing the existing backend endpoint!
      const response = await apiFetch<CursorPaginatedResponse<HomeListingCard>>(
        `/api/listings?kind=${kind}&limit=20`,
        { method: "GET", redirectOn401: false }
      );

      const mappedKind = kind === "hall" ? "venue" : "service";
      return response.data.map((item) => toExploreListing(item, mappedKind));
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
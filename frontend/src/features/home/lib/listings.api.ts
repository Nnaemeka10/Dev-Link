import { apiFetch } from "@/lib/api";
import type {
  CursorPaginatedResponse,
  HomeListingCard,
  HomeListingsPayload,
  HomeTrendingCard,
  Listing,
} from "../types/listings.types";

interface TrendingResponse {
  data: HomeTrendingCard[];
}

const HOME_LISTING_LIMIT = 4;

function toLegacyListing(listing: HomeListingCard): Listing {
  return {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    category: listing.category,
    description: listing.headline ?? "",
    priceFrom: listing.priceFrom,
  };
}

function withLimit(path: string, limit = HOME_LISTING_LIMIT): string {
  const search = new URLSearchParams({ limit: String(limit) });
  return `${path}?${search.toString()}`;
}

export const homeListingsQueryKey = ["home", "listings"] as const;

export async function getPopularHalls(): Promise<HomeListingCard[]> {
  const response = await apiFetch<CursorPaginatedResponse<HomeListingCard>>(
    withLimit("/api/listings/popular-halls"),
    { method: "GET", redirectOn401: false },
  );

  return response.data;
}

export async function getCuratedServices(): Promise<HomeListingCard[]> {
  const response = await apiFetch<CursorPaginatedResponse<HomeListingCard>>(
    withLimit("/api/listings/curated-services"),
    { method: "GET", redirectOn401: false },
  );

  return response.data;
}

export async function getTrendingHalls(): Promise<HomeTrendingCard[]> {
  const response = await apiFetch<TrendingResponse>("/api/listings/trending-halls", {
    method: "GET",
    redirectOn401: false,
  });

  return response.data;
}

export async function getTrendingServices(): Promise<HomeTrendingCard[]> {
  const response = await apiFetch<TrendingResponse>("/api/listings/trending-services", {
    method: "GET",
    redirectOn401: false,
  });

  return response.data;
}

export async function getHomeListings(): Promise<HomeListingsPayload> {
  const [popularHalls, curatedServices, trendingHalls, trendingServices] = await Promise.all([
    getPopularHalls(),
    getCuratedServices(),
    getTrendingHalls(),
    getTrendingServices(),
  ]);

  return {
    popularHalls,
    curatedServices,
    trendingHalls,
    trendingServices,
  };
}

export async function getListings(): Promise<Listing[]> {
  const response = await apiFetch<CursorPaginatedResponse<HomeListingCard>>(
    withLimit("/api/listings", HOME_LISTING_LIMIT),
    { method: "GET", redirectOn401: false },
  );

  return response.data.map(toLegacyListing);
}

export async function getListingById(id: string): Promise<Listing | null> {
  const listing = await apiFetch<HomeListingCard>(`/api/listings/${id}`, {
    method: "GET",
    redirectOn401: false,
  });

  return toLegacyListing(listing);
}

export async function getListingIds(): Promise<string[]> {
  const listings = await getListings();
  return listings.map((listing) => listing.id);
}

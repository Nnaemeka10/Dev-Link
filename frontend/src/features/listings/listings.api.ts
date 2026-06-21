import type { Listing } from "./listings.types";
import type { ListingSearchCategory, ListingSearchParams } from "./searchParams";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const FALLBACK_LISTINGS: Listing[] = [
  {
    id: "hall-lagoon-view",
    title: "Lagoon View Hall",
    location: "Lekki, Lagos",
    category: "hall",
    description: "Premium waterfront event hall for weddings, conferences, and private dinners.",
    priceFrom: 850000,
  },
  {
    id: "service-elite-catering",
    title: "Elite Catering Studio",
    location: "Ikeja, Lagos",
    category: "service",
    description: "Full-service catering with custom menus, plated service, and event staffing.",
    priceFrom: 320000,
  },
  {
    id: "hall-maple-garden",
    title: "Maple Garden Pavilion",
    location: "Abuja",
    category: "hall",
    description: "Indoor-outdoor venue with garden aisle and premium bridal suite.",
    priceFrom: 670000,
  },
];

interface SearchApiListing {
  id: string;
  title?: string;
  name?: string;
  location: string;
  category: "hall" | "service" | "halls" | "services";
  description?: string;
  priceFrom?: number;
  price_from?: number;
}

interface SearchPayload {
  results: SearchApiListing[];
  total?: number;
}

async function safeJsonFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mapCategory(category: SearchApiListing["category"]): Listing["category"] {
  return category === "service" || category === "services" ? "service" : "hall";
}

function mapSearchListing(listing: SearchApiListing): Listing {
  return {
    id: listing.id,
    title: listing.title ?? listing.name ?? "Untitled listing",
    location: listing.location,
    category: mapCategory(listing.category),
    description: listing.description ?? "Description coming soon.",
    priceFrom: listing.priceFrom ?? listing.price_from ?? 0,
  };
}

function listingMatchesCategory(listing: Listing, category: ListingSearchCategory): boolean {
  return category === "halls" ? listing.category === "hall" : listing.category === "service";
}

function filterFallbackListings(listings: Listing[], params?: ListingSearchParams): Listing[] {
  if (!params) return listings;

  return listings.filter((listing) => {
    if (!listingMatchesCategory(listing, params.category)) {
      return false;
    }

    if (params.location) {
      return listing.location.toLowerCase().includes(params.location.toLowerCase());
    }

    return true;
  });
}

function buildSearchPath(params?: ListingSearchParams): string {
  if (!params) {
    return "/api/listings";
  }

  const search = new URLSearchParams({ category: params.category });

  if (params.location) {
    search.set("location", params.location);
  }

  if (params.dateFrom) {
    search.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    search.set("dateTo", params.dateTo);
  }

  return `/api/search?${search.toString()}`;
}

export async function getListings(params?: ListingSearchParams): Promise<Listing[]> {
  if (!params) {
    const data = await safeJsonFetch<Listing[]>("/api/listings");
    return data?.length ? data : FALLBACK_LISTINGS;
  }

  const searchData = await safeJsonFetch<SearchPayload | SearchApiListing[]>(buildSearchPath(params));

  if (Array.isArray(searchData)) {
    return searchData.length ? searchData.map(mapSearchListing) : filterFallbackListings(FALLBACK_LISTINGS, params);
  }

  if (searchData?.results?.length) {
    return searchData.results.map(mapSearchListing);
  }

  return filterFallbackListings(FALLBACK_LISTINGS, params);
}

export async function getListingById(id: string): Promise<Listing | null> {
  const data = await safeJsonFetch<Listing>(`/api/listings/${id}`);
  return data ?? FALLBACK_LISTINGS.find((listing) => listing.id === id) ?? null;
}

export async function getListingIds(): Promise<string[]> {
  const listings = await getListings();
  return listings.map((listing) => listing.id);
}

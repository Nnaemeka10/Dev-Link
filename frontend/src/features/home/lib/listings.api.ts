import type { Listing } from "@/features/listings/listings.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

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

export async function getListings(): Promise<Listing[]> {
  const data = await safeJsonFetch<Listing[]>("/api/listings");
  return data?.length ? data : FALLBACK_LISTINGS;
}

export async function getListingById(id: string): Promise<Listing | null> {
  const data = await safeJsonFetch<Listing>(`/api/listings/${id}`);
  return data ?? FALLBACK_LISTINGS.find((listing) => listing.id === id) ?? null;
}

export async function getListingIds(): Promise<string[]> {
  const listings = await getListings();
  return listings.map((listing) => listing.id);
}

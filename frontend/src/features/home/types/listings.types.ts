export interface Listing {
  id: string;
  title: string;
  location: string;
  category: "hall" | "service";
  description: string;
  priceFrom: number;
}

export interface ListingImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  srcSet: string;
  isPrimary: boolean;
}

export interface HomeListingCard {
  id: string;
  title: string;
  headline: string | null;
  location: string;
  category: "hall" | "service";
  priceFrom: number;
  priceUnit: string;
  rating: number;
  primaryImage: ListingImage | null;
}

export interface HomeTrendingCard {
  id: string;
  title: string;
  headline: string | null;
  kind: "hall" | "service";
  priceFrom: number;
  priceUnit: string;
  primaryImage: ListingImage | null;
  rankScore: number;
}

export interface CursorPaginationMeta {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPaginationMeta;
}

export interface HomeListingsPayload {
  popularHalls: HomeListingCard[];
  curatedServices: HomeListingCard[];
  trendingHalls: HomeTrendingCard[];
  trendingServices: HomeTrendingCard[];
}

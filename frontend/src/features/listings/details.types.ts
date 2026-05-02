import type { StaticImageData } from "next/image";

export interface ListingFeature {
  id: string;
  label: string;
  value: string;
  icon: "capacity" | "parking" | "power" | "climate" | "suite" | "catering";
}

export interface ListingReviewMetric {
  label: string;
  value: string;
}

export interface ListingReview {
  id: string;
  name: string;
  date: string;
  initials: string;
  body: string;
}

export interface SimilarVenue {
  id: string;
  name: string;
  location: string;
  price: string;
  rating: string;
  image: StaticImageData;
}

export interface GrandAtriumDetails {
  id: "grand-atrium";
  name: string;
  location: string;
  price: string;
  rating: string;
  reviewsCount: string;
  badges: string[];
  description: string[];
  gallery: StaticImageData[];
  features: ListingFeature[];
  reviewMetrics: ListingReviewMetric[];
  reviews: ListingReview[];
  similarVenues: SimilarVenue[];
}

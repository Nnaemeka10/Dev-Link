// details.types.ts
export type ListingKind = 'hall' | 'service';

export interface ListingImageVariant {
    width: number;
    url: string;
}

export interface ListingImage {
    id: string;
    url: string;
    thumbnailUrl: string;
    srcSet: string;
    variants: ListingImageVariant[];
    isPrimary: boolean;
    sortOrder: number;
    type: 'image' | 'video' | 'virtual_tour';
}

export interface ListingBadge {
    id: number | string;
    name: string;
    iconUrl: string | null;
}

export interface ListingReviewMetric {
    label: string;
    value: number;
}

export interface ListingReview {
    id: string;
    userId: string;
    rating: number;
    body: string;
    createdAt: string;
}

export interface ListingFeature {
    id: string;
    icon: string;
    label: string;
    value: string;
}

export interface PackageFeature {
    id: string;
    text: string;
    sortOrder: number;
}

export interface ServicePackageResponse {
    id: string;
    name: string;
    price: number;
    description: string | null;
    isPopular: boolean;
    sortOrder: number;
    features: PackageFeature[];
}

export interface ListingDetailsResponse {
    id: string;
    title: string;
    name: string;
    headline: string | null;
    kind: ListingKind;
    description: string;
    location: string;
    priceFrom: number;
    unavailableDates: { from: string; to: string }[]; 
    priceUnit: string;
    rating: number;
    reviewCount: number;
    primaryImage: ListingImage | null;
    images: ListingImage[];
    badges: ListingBadge[];

    
    addressLine: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    
    capacity: number | null;
    availableFrom: string | null;
    availableTo: string | null;
    autoApprove: boolean;
    
    reviewMetrics: ListingReviewMetric[];
    reviews: ListingReview[];
    features: ListingFeature[];
    
    // Service Specific
    packages: ServicePackageResponse[];
    requirements: string[];
    responseTime: string | null;
}

export interface ListingCardSmall {
    id: string;
    title: string;
    headline: string | null;
    location: string;
    category: ListingKind;
    priceFrom: number;
    priceUnit: string;
    primaryImage: ListingImage | null;
    rating: number;
}
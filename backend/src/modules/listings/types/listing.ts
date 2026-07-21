export type ListingKind = 'hall' | 'service';

export type ListingStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'suspended' | 'archived';

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
    id: number;
    name: string;
    iconUrl: string | null;
}

export interface ListingReviewMetric {
    label: string;
    value: number;
}

export interface ListingCard {
    id: string;
    title: string;
    name: string;
    headline: string | null;
    location: string;
    category: ListingKind;
    kind: ListingKind;
    description: string;
    priceFrom: number;
    priceUnit: string;
    rating: number;
    reviewCount: number;
    capacity: number | null;
    primaryImage: ListingImage | null;
    images: ListingImage[];
    badges: ListingBadge[];
    rankScore?: number;
}

export interface ListingDetails extends ListingCard {
    addressLine: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    availableFrom: string | null;
    availableTo: string | null;
    autoApprove: boolean;
    reviewMetrics: ListingReviewMetric[];
    packages: ServicePackage[];      
    requirements: string[];            
    responseTime: string | null; 
    features: any[];
    reviews: any[];
    serviceAreas: any[];
    unavailableDates: { from: string; to: string }[];   // add this — was missing entirely
}

export interface ListingSearchQuery {
    category?: string;
    kind?: string;
    location?: string;
    q?: string;
    query?: string;
    dateFrom?: string;
    dateTo?: string;
    capacity?: string;
    role?: string;
    sort?: string;
    sortOrder?: string;
    limit?: string;
    page?: string;
    cursor?: string;
}

export interface ListingRankInput {
    averageRating: number;
    reviewCount: number;
    bookingCount?: number;
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

export interface ListingCursorPayload {
    rating?: number;
    reviewCount?: number;
    priceFrom?: number;
    createdAt?: string;
    rankScore?: number;
    id: string;
}

export type ListingSort = 'rating' | 'price' | 'reviews' | 'newest' | 'trending';

export type SortDirection = 'asc' | 'desc';

export type RankingMode = 'rating' | 'trending';

export type ListingAssetRow = {
    id: string;
    url: string;
    type: ListingImage['type'];
    isPrimary: boolean;
    sortOrder: number;
};

export type ListingReviewMetricsRow = {
    cleanliness: string | number | null;
    communication: string | number | null;
    valueForMoney: string | number | null;
    location: string | number | null;
    facilityQuality: string | number | null;
};

export type ListingRow = {
    id: string;
    title: string;
    headline: string | null;
    kind: ListingKind;
    description: string | null;
    base_price: string | number;
    price_unit: string | null;
    address_line: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    average_rating: string | number | null;
    review_count: number | null;
    capacity: number | null;
    unavailable_dates?: { from: string; to: string }[] | null;   // was `unavailableDates: string[]`
    available_from: string | null;
    available_to: string | null;
    auto_approve: boolean | null;
    created_at: string | Date;
    booking_count: string | number | null;
    badges: ListingBadge[] | null;
    assets: ListingAssetRow[] | null;
    review_metrics?: ListingReviewMetricsRow | null;
    packages?: ServicePackage[] | null;         
    service_metadata?: ServiceMetadata | null;
    features?: any[] | null;
    reviews?: any[] | null;
    service_areas?: any[] | null;   // was `serviceAreas`
};

export interface ListingFilters {
    kind?: ListingKind;
    location?: string;
    searchTerm?: string;
    capacity?: number;
    dateFrom?: string;
    dateTo?: string;
    excludeId?: string;
}

export interface ListingPageOptions {
    filters: ListingFilters;
    limit: number;
    cursor: ListingCursorPayload | null;
    sort: ListingSort;
    sortDirection: SortDirection;
}

export interface TrendingCard {
    id: string;
    title: string;
    headline: string | null;
    kind: ListingKind;
    priceFrom: number;
    priceUnit: string;
    primaryImage: ListingImage | null;
    rankScore: number;
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

export interface PackageFeature {
    id: string;
    text: string;
    sortOrder: number;
}

export interface ServicePackage {
    id: string;
    name: string;
    price: number;
    description: string | null;
    isPopular: boolean;
    sortOrder: number;
    features: PackageFeature[];
}

export interface ServiceMetadata {
    requirements?: string[];
    response_time?: string;
}
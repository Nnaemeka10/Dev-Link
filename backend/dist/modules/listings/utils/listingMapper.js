import { buildListingImageVariants, buildListingThumbnailUrl, buildSrcSet, } from './cloudinaryImage.js';
import { calculateTrendingScore } from './ranking.js';
export function toNumber(value) {
    if (value === null || value === undefined)
        return 0;
    return Number(value);
}
function getLocation(row) {
    return [row.city, row.state, row.country].filter(Boolean).join(', ');
}
function mapAsset(asset) {
    const variants = buildListingImageVariants(asset.url);
    return {
        id: asset.id,
        url: asset.url,
        thumbnailUrl: buildListingThumbnailUrl(asset.url),
        srcSet: buildSrcSet(variants),
        variants,
        isPrimary: asset.isPrimary,
        sortOrder: asset.sortOrder,
        type: asset.type,
    };
}
export function mapListingCard(row) {
    const images = (row.assets ?? []).map(mapAsset);
    const primaryImage = images.find((image) => image.isPrimary) ?? images[0] ?? null;
    const rating = toNumber(row.average_rating);
    const reviewCount = Number(row.review_count ?? 0);
    const bookingCount = toNumber(row.booking_count);
    return {
        id: row.id,
        title: row.title,
        name: row.title,
        headline: row.headline,
        location: getLocation(row),
        category: row.kind,
        kind: row.kind,
        description: row.description ?? '',
        priceFrom: toNumber(row.base_price),
        priceUnit: row.price_unit ?? 'per event',
        rating,
        reviewCount,
        capacity: row.capacity,
        primaryImage,
        images,
        badges: row.badges ?? [],
        rankScore: calculateTrendingScore({
            averageRating: rating,
            reviewCount,
            bookingCount,
        }),
    };
}
function mapReviewMetrics(row) {
    const metrics = row.review_metrics;
    if (!metrics)
        return [];
    return [
        { label: 'Cleanliness', value: toNumber(metrics.cleanliness) },
        { label: 'Communication', value: toNumber(metrics.communication) },
        { label: 'Value for money', value: toNumber(metrics.valueForMoney) },
        { label: 'Location', value: toNumber(metrics.location) },
        { label: 'Facility quality', value: toNumber(metrics.facilityQuality) },
    ];
}
export function mapListingDetails(row) {
    const metadata = row.service_metadata;
    return {
        ...mapListingCard(row),
        addressLine: row.address_line,
        city: row.city,
        state: row.state,
        country: row.country,
        latitude: row.latitude === null ? null : toNumber(row.latitude),
        longitude: row.longitude === null ? null : toNumber(row.longitude),
        availableFrom: row.available_from,
        availableTo: row.available_to,
        autoApprove: Boolean(row.auto_approve),
        reviewMetrics: mapReviewMetrics(row),
        packages: (row.packages ?? []).map(mapPackage),
        requirements: metadata?.requirements ?? [],
        responseTime: metadata?.response_time ?? null,
        features: (row.features ?? []),
        reviews: (row.reviews ?? []),
        serviceAreas: (row.service_areas ?? []), // was row.serviceAreas
        unavailableDates: (row.unavailable_dates ?? []),
    };
}
export function mapTrendingCard(row) {
    const images = (row.assets ?? []).map(mapAsset);
    const primaryImage = images.find((image) => image.isPrimary) ?? images[0] ?? null;
    return {
        id: row.id,
        title: row.title,
        headline: row.headline,
        kind: row.kind,
        priceFrom: toNumber(row.base_price),
        priceUnit: row.price_unit ?? 'per event',
        primaryImage,
        rankScore: calculateTrendingScore({
            averageRating: toNumber(row.average_rating),
            reviewCount: Number(row.review_count ?? 0),
            bookingCount: toNumber(row.booking_count),
        }),
    };
}
export function mapListingCardSmall(row) {
    const images = (row.assets ?? []).map(mapAsset);
    const primaryImage = images.find((image) => image.isPrimary) ?? images[0] ?? null;
    return {
        id: row.id,
        title: row.title,
        headline: row.headline,
        location: getLocation(row),
        category: row.kind,
        rating: toNumber(row.average_rating),
        priceFrom: toNumber(row.base_price),
        priceUnit: row.price_unit ?? 'per event',
        primaryImage,
    };
}
function mapPackage(pkg) {
    return {
        id: pkg.id,
        name: pkg.name,
        price: toNumber(pkg.price),
        description: pkg.description ?? '',
        isPopular: Boolean(pkg.isPopular),
        sortOrder: pkg.sortOrder,
        features: (pkg.features ?? []).map((f) => ({
            id: f.id,
            text: f.text,
            sortOrder: f.sortOrder,
        })),
    };
}
//# sourceMappingURL=listingMapper.js.map
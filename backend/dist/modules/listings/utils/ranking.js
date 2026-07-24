const RATING_WEIGHT = 0.55;
const REVIEW_WEIGHT = 0.30;
const BOOKING_WEIGHT = 0.15;
const MAX_RATING = 5;
const REVIEW_NORMALIZER = 250;
const BOOKING_NORMALIZER = 100;
function clamp(value, min = 0, max = 1) {
    return Math.min(Math.max(value, min), max);
}
function normalizedLogScore(value, normalizer) {
    if (value <= 0)
        return 0;
    return clamp(Math.log1p(value) / Math.log1p(normalizer));
}
export function calculateTrendingScore(input) {
    const ratingScore = clamp(input.averageRating / MAX_RATING);
    const reviewScore = normalizedLogScore(input.reviewCount, REVIEW_NORMALIZER);
    const bookingScore = normalizedLogScore(input.bookingCount ?? 0, BOOKING_NORMALIZER);
    const score = ratingScore * RATING_WEIGHT +
        reviewScore * REVIEW_WEIGHT +
        bookingScore * BOOKING_WEIGHT;
    return Number((score * 100).toFixed(4));
}
//# sourceMappingURL=ranking.js.map
export const HALL_REVIEW_DIMENSIONS = [
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'communication', label: 'Communication' },
    { key: 'value_for_money', label: 'Value for money' },
    { key: 'location', label: 'Location' },
    { key: 'facility_quality', label: 'Facility quality' },
] as const;

export const SERVICE_REVIEW_DIMENSIONS = [
    { key: 'quality_of_work', label: 'Quality of work' },
    { key: 'professionalism', label: 'Professionalism' },
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'communication', label: 'Communication' },
    { key: 'value_for_money', label: 'Value for money' },
] as const;

export function dimensionsForKind(kind: string): ReadonlyArray<{ key: string; label: string }> {
    return kind === 'service' ? SERVICE_REVIEW_DIMENSIONS : HALL_REVIEW_DIMENSIONS;
}

export interface ReviewRow {
    id: string;
    listing_id: string;
    user_id: number;
    booking_id: string | null;
    rating: string | number;
    body: string | null;
    sub_ratings: Record<string, number>;
    created_at: string;
    updated_at: string;
}

export interface SubmitReviewInput {
    rating: number;
    body: string;
    subRatings: Record<string, number>;
}
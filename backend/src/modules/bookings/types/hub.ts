export type BookingBucket = 'upcoming' | 'completed' | 'cancelled';
export type HubListingKind = 'hall' | 'service';

/** Shared reason/category vocabularies — the frontend imports the same keys. */
export const REFUND_REASONS = [
    'vendor_unresponsive',
    'changed_plans',
    'listing_inaccurate',
    'duplicate_booking',
    'other',
] as const;
export type RefundReason = typeof REFUND_REASONS[number];

export const COMPLAINT_CATEGORIES = [
    'service_quality',
    'vendor_behavior',
    'listing_mismatch',
    'payment_issue',
    'safety',
    'other',
] as const;
export type ComplaintCategory = typeof COMPLAINT_CATEGORIES[number];

/** Server-driven eligibility — the frontend renders, never decides. */
export interface BookingActions {
    canChat: boolean;
    canRequestRefund: boolean;
    canReview: boolean;
    canComplaint: boolean;
    canRebook: boolean;
    canDownloadReceipt: boolean;
}

export interface MyBookingItem {
    id: string;
    bookingReference: string;
    status: string;
    bucket: BookingBucket;
    kind: HubListingKind;
    listingId: string;
    listingTitle: string;
    listingImage: string | null;
    /** Resolved display location: hall address for halls, event_location for services. */
    location: string | null;
    eventLocation: string | null;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    excludedDates: string[];
    totalAmount: number;
    currency: string;
    guests: number;
    paidAt: string | null;
    createdAt: string;
    cancelledAt: string | null;
    cancellationReason: string | null;
    vendorName: string;
    refundStatus: string | null;
    refundWindowClosesAt: string | null;
    refundWindowOpen: boolean;
    hasReview: boolean;
    myReviewRating: number | null;
    actions: BookingActions;
}

export interface HubBookingDetails extends MyBookingItem {
    subtotal: number;
    vat: number;
    packageName: string | null;
    listingCapacity: number | null;
    listingCity: string | null;
    listingState: string | null;
    listingAddress: string | null;
    vendorFirstName: string | null;
    vendorLastName: string | null;
    vendorEmail: string | null;
    vendorPhone: string | null;
    myReview: { rating: number; body: string | null; subRatings: Record<string, number> } | null;
    refund: {
        status: string;
        reason: string;
        description: string | null;
        source: string;
        createdAt: string;
        processedAt: string | null;
    } | null;
}
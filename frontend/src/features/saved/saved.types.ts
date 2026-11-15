export type TopTab = "saved" | "bookings";
export type SavedKind = "halls" | "services";
export type BookingBucket = "upcoming" | "completed" | "cancelled";
export type KindFilter = "all" | "halls" | "services";
export type HubListingKind = "hall" | "service";

export const REFUND_REASONS = [
  { key: "vendor_unresponsive", label: "Vendor unresponsive" },
  { key: "changed_plans", label: "Changed plans" },
  { key: "listing_inaccurate", label: "Listing inaccurate" },
  { key: "duplicate_booking", label: "Duplicate booking" },
  { key: "other", label: "Other" },
] as const;
export type RefundReason = (typeof REFUND_REASONS)[number]["key"];

export const COMPLAINT_CATEGORIES = [
  { key: "service_quality", label: "Service quality" },
  { key: "vendor_behavior", label: "Vendor behavior" },
  { key: "listing_mismatch", label: "Listing mismatch" },
  { key: "payment_issue", label: "Payment issue" },
  { key: "safety", label: "Safety" },
  { key: "other", label: "Other" },
] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]["key"];

export const HALL_REVIEW_DIMENSIONS = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "communication", label: "Communication" },
  { key: "value_for_money", label: "Value for money" },
  { key: "location", label: "Location" },
  { key: "facility_quality", label: "Facility quality" },
] as const;

export const SERVICE_REVIEW_DIMENSIONS = [
  { key: "quality_of_work", label: "Quality of work" },
  { key: "professionalism", label: "Professionalism" },
  { key: "punctuality", label: "Punctuality" },
  { key: "communication", label: "Communication" },
  { key: "value_for_money", label: "Value for money" },
] as const;

export function reviewDimensionsFor(kind: HubListingKind) {
  return kind === "service" ? SERVICE_REVIEW_DIMENSIONS : HALL_REVIEW_DIMENSIONS;
}

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

export interface MyReview {
  id: string;
  bookingId: string;
  listingId: string;
  rating: number;
  body: string;
  subRatings: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}
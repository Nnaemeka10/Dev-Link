//
// Vendor Dashboard - shared types
// These mirror the API contract in modules/vendor exactly. Dates arrive as
// ISO strings (YYYY-MM-DD for event days, full ISO for timestamps) so the UI
// owns formatting and can rebuild split ranges from excludedDates.
//

export type BookingStatus =
  | "confirmed" | "pending" | "completed" | "cancelled" | "declined"
  | "funds_held" | "paid" | "processing_payout" | "payout_released"
  | "refunded" | "failed" | "expired";

/** No "all" - Pending is the actionable default on every breakpoint. */
export type BookingFilterKey = "pending" | "upcoming" | "completed" | "cancelled";

export type BookingSortKey =
  | "newest"
  | "oldest"
  | "event_soonest"
  | "amount_desc"
  | "amount_asc";

export interface BookingFilterTab {
  key: BookingFilterKey;
  label: string;
  count: number;
}

export const BOOKING_FILTER_LABELS: Record<BookingFilterKey, string> = {
  pending: "Pending",
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BOOKING_SORT_OPTIONS: { key: BookingSortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "event_soonest", label: "Event date (soonest)" },
  { key: "amount_desc", label: "Amount: high to low" },
  { key: "amount_asc", label: "Amount: low to high" },
];

/** Mirrors DECLINE_REASONS in modules/vendor/models/VendorDashboard.ts. */
export const DECLINE_REASONS = [
  { key: "dates_unavailable", label: "Dates are no longer available" },
  { key: "fully_booked", label: "Fully booked for this period" },
  { key: "cannot_fulfil", label: "Unable to fulfil this request" },
  { key: "incorrect_details", label: "Booking details are incorrect" },
  { key: "other", label: "Other" },
] as const;
export type DeclineReasonKey = (typeof DECLINE_REASONS)[number]["key"];

export interface VendorProfile {
  id: string;
  name: string;
  firstName: string;
  avatarUrl: string;
  isFirstVisit: boolean;
  unreadMessages: number;
}

export interface FinancialSummary {
  currencySymbol: string;
  /** Net of every confirmed-and-beyond booking. Cancelled/refunded excluded. */
  totalRevenue: number;
  /** Net actually credited to the vendor's bank (payout_released). */
  totalPaidOut: number;
  /** Earned but not yet credited - still in escrow or in flight. */
  inEscrow: number;
  totalRevenueChangePercent?: number | null;
  confirmedBookings: number;
  confirmedBookingsChangePercent?: number | null;
  pendingBookings: number;
  pendingBookingsNote: string;
}

export interface RevenueTrendPoint {
  month: string;
  currentPeriodValue: number;
  previousPeriodValue: number;
  currentPeriodHeightPct: number;
  previousPeriodHeightPct: number;
}

export interface RevenueTrend {
  rangeLabel: string;
  currentLabel: string;
  previousLabel: string;
  points: RevenueTrendPoint[];
}

export type TransactionStatus = "completed" | "processing" | "failed";
export type TransactionDirection = "credit" | "debit";
export type TransactionIcon =
  | "venue" | "photography" | "sound" | "hosting" | "design" | "withdrawal";

/** Minimal row - the dashboard shows 3, the ledger page shows 10 per page. */
export interface Transaction {
  id: string;
  title: string;
  referenceId: string;
  /** Full ISO timestamp. */
  date: string | null;
  icon: TransactionIcon;
  status: TransactionStatus;
  direction: TransactionDirection;
  amount: number;
  bookingId: string | null;
  listingTitle: string | null;
  clientName: string | null;
}

export interface TransactionDetail {
  id: string;
  amount: number;
  currency: string;
  direction: TransactionDirection;
  status: TransactionStatus;
  createdAt: string | null;
  description: string;
  paystackReference: string | null;
  transactionGroup: string;
  idempotencyKey: string;
  isService: boolean;
  booking: {
    id: string;
    reference: string;
    status: BookingStatus;
    kind: "hall" | "service";
    startDate: string;
    endDate: string;
    excludedDates: string[];
    time: string;
    guests: number;
    eventLocation: string | null;
    preferences: string | null;
    packageName: string | null;
    paidAt: string | null;
    disputeWindowClosesAt: string | null;
    totalAmount: number;
    subtotal: number;
    vat: number;
    commission: number;
    vendorNet: number;
    currency: string;
  } | null;
  listing: {
    id: string;
    title: string;
    kind: "hall" | "service";
    location: string | null;
  } | null;
  client: { name: string; avatarUrl: string | null } | null;
  payout: {
    status: string;
    dispatchReference: string;
    transferCode: string | null;
    dispatchedAt: string | null;
    completedAt: string | null;
  } | null;
  destination: {
    bankName: string;
    accountLast4: string;
    accountName: string | null;
  } | null;
}

/** Minimal booking card - identical shape on mobile and desktop. */
export interface BookingRecord {
  id: string;
  bookingRef: string;
  status: BookingStatus;
  kind: "hall" | "service";
  clientName: string;
  clientFirstName: string;
  clientAvatarUrl: string | null;
  eventType: string;
  listing: {
    id: string;
    type: "venue" | "service";
    name: string;
    label: string;
  };
  /** ISO YYYY-MM-DD envelope. */
  dateRange: { start: string; end: string | null };
  excludedDates: string[];
  /** "16:00 – 23:00" (24-hour). */
  time: string;
  totalPrice: number;
  vendorNet: number;
  packageName: string | null;
  eventLocation: string | null;
  createdAt: string | null;
  paidAt: string | null;
}

export interface BookingDetail extends BookingRecord {
  client: {
    name: string;
    firstName: string;
    avatarUrl: string | null;
    email: string | null;
    phone: string | null;
  };
  listing: BookingRecord["listing"] & {
    kind: "hall" | "service";
    location: string | null;
    address: string | null;
    capacity: number | null;
  };
  /** Hall: venue address. Service: where the customer wants delivery. */
  location: string | null;
  guests: number;
  preferences: string | null;
  startTime: string | null;
  endTime: string | null;
  money: {
    total: number;
    subtotal: number;
    vat: number;
    commission: number;
    vendorNet: number;
    currency: string;
  };
  paymentStatus: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  disputeWindowClosesAt: string | null;
  payoutHold: boolean;
  refund: {
    status: string;
    reason: string;
    description: string | null;
    amount: number;
    createdAt: string | null;
    processedAt: string | null;
  } | null;
  payout: {
    status: string;
    dispatchReference: string;
    transferCode: string | null;
    amount: number;
    createdAt: string | null;
    completedAt: string | null;
  } | null;
  canConfirm: boolean;
  canDecline: boolean;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface VendorListing {
  id: string;
  title: string;
  location: string;
  status: "active" | "draft" | "in_review" | "rejected" | "offline";
  canEdit: boolean;
  pricePerUnit: number;
  unit: string;
  thumbnailUrl: string;
  viewsLast30Days: number;
  bookingsLast30Days: number;
}

export interface MyListingsStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  avgRating: number;
}

export interface VendorDashboardSummary {
  totalRevenue: number;
  totalPaidOut: number;
  inEscrow: number;
  revenueChangePercent: number | null;
  confirmedBookings: number;
  pendingBookings: number;
  nextPayoutDate: string | null;
  nextPayoutListing: string | null;
  filterCounts: Record<BookingFilterKey, number>;
}

export interface TransactionsPage {
  transactions: Transaction[];
  pagination: PaginationState;
}

export interface BookingsPage {
  bookings: BookingRecord[];
  pagination: PaginationState;
}

/** Legacy mock shape - kept so data.ts continues to type-check. */
export interface VendorDashboardData {
  vendor: VendorProfile;
  financialSummary: FinancialSummary;
  revenueTrend: RevenueTrend;
  transactions: Transaction[];
  bookingFilters: BookingFilterTab[];
  bookings: BookingRecord[];
  bookingsPagination: PaginationState;
}
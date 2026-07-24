// ────────────────────────────────────────────────────────────────────────────
// Vendor Dashboard — shared types
// These mirror the shape the backend is expected to return. Swap `data.ts`
// for a real fetch/hook layer later without touching the UI components.
// ────────────────────────────────────────────────────────────────────────────

export type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled";

export type BookingFilterKey = "all" | "upcoming" | "completed" | "cancelled";

export interface VendorProfile {
  id: string;
  name: string;
  firstName: string;
  avatarUrl: string;
  /** true if this is the vendor's first session in the app — flips the greeting copy */
  isFirstVisit: boolean;
  unreadMessages: number;
}

export interface FinancialSummary {
  currencySymbol: string;
  totalRevenue: number;
  totalRevenueChangePercent: number;
  confirmedBookings: number;
  confirmedBookingsChangePercent: number;
  pendingBookings: number;
  pendingBookingsNote: string;
}

export interface RevenueTrendPoint {
  month: string;
  currentPeriodValue: number;
  previousPeriodValue: number;
  /** 0–100, pre-computed bar heights so the UI never does chart math */
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
  | "venue"
  | "photography"
  | "sound"
  | "hosting"
  | "design"
  | "withdrawal";

export interface Transaction {
  id: string;
  title: string;
  referenceId: string;
  date: string;
  icon: TransactionIcon;
  status: TransactionStatus;
  direction: TransactionDirection;
  amount: number;
}

export interface BookingRecord {
  id: string;
  bookingRef: string;
  clientName: string;
  clientAvatarUrl: string;
  eventType: string;
  dateRange: {
    start: string;
    end: string | null;
  };
  time: string;
  listing: {
    type: "venue" | "service";
    name: string;
    label: string;
  };
  totalPrice: number;
  status: BookingStatus;
}

export interface BookingFilterTab {
  key: BookingFilterKey;
  label: string;
  count: number;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface VendorDashboardData {
  vendor: VendorProfile;
  financialSummary: FinancialSummary;
  revenueTrend: RevenueTrend;
  transactions: Transaction[];
  bookingFilters: BookingFilterTab[];
  bookings: BookingRecord[];
  bookingsPagination: PaginationState;
}
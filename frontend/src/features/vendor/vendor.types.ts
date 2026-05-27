export interface VendorEarningSummary {
  today: number;
  thisMonth: number;
  pendingClearance: number;
}

export type RequestStatus = "pending" | "approved" | "declined";

export interface BookingRequest {
  id: string;
  guestName: string;
  guestAvatar?: string;
  listingName: string;
  date: string;
  status: RequestStatus;
  amount: number;
}

export type ListingStatus = "active" | "draft" | "offline";

export interface VendorListing {
  id: string;
  title: string;
  location: string;
  status: ListingStatus;
  pricePerUnit: number;
  unit: string;
  thumbnailUrl: string;
  viewsLast30Days: number;
  bookingsLast30Days: number;
}

export interface VendorDashboardData {
  earnings: VendorEarningSummary;
  upcomingBookings: BookingRequest[];
  pendingRequests: BookingRequest[];
}

import type { DateRange } from "@/features/search/utils/searchSchema";
import type { StaticImageData } from "next/image";

export type BookingPaymentMethod = "card" | "transfer" | "crypto";

export interface BookingFormState {
  contactEmail: string;
  contactName: string;
  /**
   * Envelope (earliest start - latest end). Kept in sync with `dateRanges`
   * for display and the detail-page localStorage hand-off.
   */
  dateRange: DateRange | undefined;
  /**
   * Source of truth for the booking calendar: disjoint, completed ranges.
   * Gaps between ranges become `excludedDates` in the quote/booking payload.
   */
  dateRanges: DateRange[];
  endTime: string;
  preferences: string;
  startTime: string;
  termsAccepted: boolean;
  packageId?: string;
}

export interface BookingSummaryData {
  bookingId: string;
  accessCode: string;
  reference: string;
  amount: number; // From backend
  currency: string;
}

export interface BookingVenue {
  capacity: string;
  image: StaticImageData;
  location: string;
  name: string;
  rating: string;
  reviewsCount: string;
}

export interface BookingFee {
  label: string;
  value: string;
}

export interface BookingDetailsResponse {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  excluded_dates?: string[];
  start_time: string | null;
  end_time: string | null;
  status: string;
  total_amount: number;
  currency: string;
  booking_reference: string;
  listing_title: string;
  listing_image: string | null;
  listing_location: string;
  listing_capacity: number | null;
  vendor_first_name: string | null;
  vendor_last_name: string | null;
  vendor_phone: string | null;
  vendor_email: string | null;
  auto_approve: boolean;
  package_id: string | null;
  package_name: string | null;
}
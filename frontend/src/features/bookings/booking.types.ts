import type { DateRange } from "@/features/search/utils/searchSchema";
import type { StaticImageData } from "next/image";

export type BookingPaymentMethod = "card" | "transfer" | "crypto";

export interface BookingFormState {
  contactEmail: string;
  contactName: string;
  dateRange: DateRange | undefined;
  endTime: string;
  guestNames: string[];
  guests: number;
  preferences: string;
  startTime: string;
  termsAccepted: boolean;
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
    start_time: string | null;
    end_time: string | null;
    status: string;
    total_amount: number;
    currency: string;
    booking_reference: string;
    listing_title: string;
    listing_image: string | null;
    listing_location: string;
    vendor_first_name: string | null;
    vendor_last_name: string | null;
    vendor_phone: string | null;
    vendor_email: string | null;
}

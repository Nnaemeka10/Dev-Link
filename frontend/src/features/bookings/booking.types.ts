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

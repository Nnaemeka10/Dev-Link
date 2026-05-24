import type { DateRange } from "@/features/search/utils/searchSchema";
import type { StaticImageData } from "next/image";

export type BookingPaymentMethod = "card" | "transfer" | "crypto";

export interface BookingFormState {
  cardCvv: string;
  cardExpiry: string;
  cardName: string;
  cardNumber: string;
  contactEmail: string;
  contactName: string;
  dateRange: DateRange | undefined;
  endTime: string;
  guestNames: string[];
  guests: number;
  paymentMethod: BookingPaymentMethod;
  preferences: string;
  startTime: string;
  termsAccepted: boolean;
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

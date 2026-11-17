import type { DateRange } from "@/features/search/utils/searchSchema";
import type { StaticImageData } from "next/image";

export type BookingPaymentMethod = "card" | "transfer" | "crypto";

/**
 * Where the customer wants a SERVICE delivered. Halls never send this -
 * the venue IS the location. Mirrors BookingEventLocationInput on the API:
 * the server resolves stateId/lgaId against nigeria_states / nigeria_lgas
 * and stores one composed string in bookings.event_location.
 */
export interface BookingEventLocation {
  address: string;
  stateId: string;
  lgaId: string;
  /** Fixed for now - the form renders it read-only. */
  country: "Nigeria";
}

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
  /** 24-hour "HH:MM". */
  endTime: string;
  /** Free-text notes to the vendor (max 1000 chars, enforced client + server). */
  preferences: string;
  /** 24-hour "HH:MM". */
  startTime: string;
  termsAccepted: boolean;
  packageId?: string;
  /** Service delivery address. Ignored for halls. */
  eventLocation: BookingEventLocation;
  /** Expected guests (halls only - services always send 1). */
  guests: number;
}

export interface BookingSummaryData {
  bookingId: string;
  accessCode: string;
  reference: string;
  amount: number;
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

export interface PaymentSummaryFee {
  label: string;
  value: string;
  /** Renders the label underlined - used for the "× N days" line. */
  sublabel?: string;
}

/**
 * One summary contract shared by the desktop PaymentSummary and the mobile
 * payment sheet, so the two can never drift. Dates/times are pre-formatted
 * strings: multi-range selections and the 24-hour clock are resolved once,
 * upstream, instead of re-derived in each surface.
 */
export interface PaymentSummaryData {
  venueName: string;
  venueLocation: string;
  venueImage: string | StaticImageData;
  eventName: string;
  /** "10 Dec – 14 Dec · 16 Dec" - split ranges included. */
  eventDateLabel: string;
  /** "16:00 – 23:00" (24-hour). */
  eventTimeLabel: string;
  /** Halls only. Undefined for services (they have no capacity). */
  guests?: string;
  kind: "hall" | "service";
  /** "Venue" for halls, "Event location" for services. */
  locationLabel: string;
  verified: boolean;
  fees: PaymentSummaryFee[];
  total: string;
  totalNote?: string;
}

/** GET /api/bookings/:id - the wizard/confirmation contract. */
export interface BookingDetailsResponse {
  id: string;
  listing_id: string;
  /** Drives every hall/service branch on the confirmation screen. */
  kind: "hall" | "service";
  start_date: string;
  end_date: string;
  excluded_dates?: string[];
  start_time: string | null;
  end_time: string | null;
  status: string;
  total_amount: number;
  currency: string;
  booking_reference: string;
  guests: number;
  preferences: string | null;
  paid_at: string | null;
  created_at: string;
  listing_title: string;
  listing_image: string | null;
  /** Hall: full venue address. Service: the vendor's base location. */
  listing_location: string;
  listing_address: string | null;
  listing_capacity: number | null;
  /** Service only: where the customer wants the service delivered. */
  event_location: string | null;
  vendor_first_name: string | null;
  vendor_last_name: string | null;
  vendor_phone: string | null;
  vendor_email: string | null;
  auto_approve: boolean;
  package_id: string | null;
  package_name: string | null;
  subtotal_amount?: string | number | null;
  vat_amount?: string | number | null;
}
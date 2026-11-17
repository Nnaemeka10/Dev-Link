export type BookingStatus =
  | 'pending'           // created, awaiting payment
  | 'paid'              // paid (card/Paystack), awaiting vendor confirmation
  | 'funds_held'        // paid via DVA/escrow transfer, awaiting vendor confirmation
  | 'confirmed'         // vendor confirmed
  | 'declined'          // vendor/admin rejected
  | 'cancelled'
  | 'completed'
  | 'processing_payout'
  | 'payout_released'
  | 'refunded'
  | 'failed'
  | 'expired';

/**
 * Structured event location for SERVICE bookings - where the customer wants
 * the vendor to show up. Resolved server-side against nigeria_states /
 * nigeria_lgas and stored as one composed string in bookings.event_location.
 * Halls never send this (the venue IS the location).
 */
export interface BookingEventLocationInput {
  address: string;
  stateId: string;
  lgaId: string;
  /** Always "Nigeria" for now - the form renders it fixed. */
  country?: string;
}

export interface BookingRow {
  id: string;
  listing_id: string;
  user_id: number;
  start_date: string;
  end_date: string;
  /** Interior days removed from the booking (sorted YYYY-MM-DD). */
  excluded_dates: string[];
  status: BookingStatus;
  total_amount: number;
  guests: number;
  created_at: string;
  booking_reference: string;
  start_time: string | null;
  end_time: string | null;
  currency: string;
  payment_reference: string | null;
  payment_provider: string;
  payment_status: string;
  paid_at: string | null;
  package_id: string | null;
  expires_at: string | null;
  /** Pre-VAT subtotal (Naira). Written at creation; authoritative for payouts. */
  subtotal_amount?: string | number | null;
  /** VAT collected (Naira). A liability, never platform revenue. */
  vat_amount?: string | number | null;
  /** Composed service delivery address (hall bookings leave this NULL). */
  event_location?: string | null;
  /** Customer notes to the vendor. */
  preferences?: string | null;
}

export interface CreateBookingInput {
  listingId: string;
  startDate: string; // ISO string - envelope start
  endDate: string;   // ISO string - envelope end
  /** Interior days the customer deselected (YYYY-MM-DD). Optional. */
  excludedDates?: string[];
  startTime: string; // "16:00" (24h)
  endTime: string;   // "23:00" (24h)
  preferences?: string;
  packageId?: string;
  /** Required for service listings; ignored for halls. */
  eventLocation?: BookingEventLocationInput | null;
  /** Expected guests (halls). Defaults to 1. */
  guests?: number;
}

export interface BookingResponse {
  bookingId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface BookingDetailsResponse extends BookingRow {
  kind: 'hall' | 'service';
  listing_title: string;
  listing_image: string | null;
  listing_location: string;
  listing_address: string | null;
  listing_capacity: number | null;
  vendor_first_name: string | null;
  vendor_last_name: string | null;
  vendor_phone: string | null;
  vendor_email: string | null;
  auto_approve: boolean;
  package_name: string | null;
}
import type { BookingFormState } from "./booking.types";

export const BOOKING_STORAGE_KEY = "eventvnv:booking-draft";

/** Mirrors the API's clamp (BookingModel.normalizePreferences). */
export const MAX_PREFERENCES_LENGTH = 1000;
/** Fallback ceiling when a hall hasn't declared its capacity. */
export const MAX_GUESTS_FALLBACK = 5000;
export const MIN_GUESTS = 1;

export const DEFAULT_BOOKING_FORM: BookingFormState = {
  contactEmail: "",
  contactName: "",
  dateRange: undefined,
  dateRanges: [],
  startTime: "16:00",
  endTime: "23:00",
  preferences: "",
  termsAccepted: false,
  packageId: "",
  eventLocation: { address: "", stateId: "", lgaId: "", country: "Nigeria" },
  guests: 1,
};

export const BOOKING_STEPS = ["Booking Details", "Review & Pay", "Confirmation"];
export const MOBILE_BOOKING_STEPS = ["Booking Details", "Review & Pay", "Confirmation"];
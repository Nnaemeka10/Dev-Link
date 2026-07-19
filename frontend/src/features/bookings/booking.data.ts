
import type { BookingFormState } from "./booking.types";

export const BOOKING_STORAGE_KEY = "eventvnv:booking-draft";

export const DEFAULT_BOOKING_FORM: BookingFormState = {
  contactEmail: "",
  contactName: "",
  dateRange: undefined,
  endTime: "23:00",
  preferences: "",
  startTime: "16:00",
  termsAccepted: false,
};

export const BOOKING_STEPS = ["Booking Details", "Review & Pay", "Confirmation"];
export const MOBILE_BOOKING_STEPS = ["Booking Details", "Review & Pay", "Confirmation"];


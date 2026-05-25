import hallA from "@/assets/home/populareventsa.png";
import hallD from "@/assets/home/populareventsd.png";
import type { BookingFee, BookingFormState, BookingVenue } from "./booking.types";

export const BOOKING_STORAGE_KEY = "editorial-marketplace:grand-atrium-booking";

export const DEFAULT_BOOKING_FORM: BookingFormState = {
  cardCvv: "",
  cardExpiry: "",
  cardName: "",
  cardNumber: "",
  contactEmail: "",
  contactName: "",
  date: "2024-12-14",
  endTime: "23:00",
  guestNames: [],
  guests: 250,
  paymentMethod: "card",
  preferences: "",
  startTime: "16:00",
  termsAccepted: true,
  dateRange: {
    from: new Date("2024-12-14"),
    to: new Date("2024-12-14"),
  },
};

export const BOOKING_VENUE: BookingVenue = {
  capacity: "Up to 1,200 guests",
  image: hallD,
  location: "Victoria Island, Lagos",
  name: "The Grand Atrium",
  rating: "4.9",
  reviewsCount: "128 reviews",
};

export const BOOKING_GALLERY_IMAGE = hallA;

export const BOOKING_FEES: BookingFee[] = [
  { label: "Base venue hire (Full Day)", value: "₦1,250,000" },
  { label: "VAT", value: "₦150,000" },
  { label: "Service fee", value: "₦42,000" },
];

export const PAYMENT_FEES: BookingFee[] = [
  { label: "Venue Rental (Full Day)", value: "₦1,200,000" },
  { label: "VAT", value: "₦100,000" },
  { label: "Service Charge (5%)", value: "₦75,000" },
];

export const BOOKING_TOTAL = "₦1,442,000";
export const PAYMENT_TOTAL = "₦1,375,000";

export const HOST_CONTACT = {
  email: "amara.o@grandatrium.ng",
  name: "Amara Okoro",
  phone: "+234 802 000 1234",
  role: "Senior Events Director",
};

export const BOOKING_STEPS = ["Booking Details", "Payment", "Review", "Confirmation"];
export const MOBILE_BOOKING_STEPS = ["Booking Details", "Payment", "Confirmation"];

export const TIME_OPTIONS = ["09:00", "12:00", "16:00", "18:00", "23:00"];

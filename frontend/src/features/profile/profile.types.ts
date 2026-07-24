// export type ProfileSection = 
//   | "personal_info"
//   | "bookings"
//   | "payments"
//   | "security"
//   | "notifications";

// export interface UserProfile {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   avatarUrl?: string;
//   joinDate: string;
//   isVerified: boolean;
// }

// export interface BookingHistoryItem {
//   id: string;
//   title: string;
//   date: string;
//   status: "upcoming" | "completed" | "cancelled";
//   amount: number;
//   imageUrl?: string;
// }

// export interface PaymentMethod {
//   id: string;
//   type: "card" | "bank_transfer";
//   last4?: string;
//   expiryDate?: string;
//   isDefault: boolean;
// }

// export interface NotificationSettings {
//   emailPromotions: boolean;
//   smsAlerts: boolean;
//   pushNotifications: boolean;
//   bookingUpdates: boolean;
// }
// ─── Backend Response Shapes ──────────────────────────────────────────────────

export interface NotificationSettings {
  emailPromotions: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  bookingUpdates: boolean;
}

export interface ProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  joinDate: string;
  notifications: NotificationSettings;
}

export type FrontendBookingStatus = "pending" | "confirmed" | "past" | "cancelled";

export interface BookingResponse {
  id: string;
  eventTitle: string;
  vendorName: string;
  eventDate: string;
  bookedOn: string;
  status: FrontendBookingStatus;
  amount: number;
  imageUrl: string | null;
  location: string;
  ticketCount: number;
}

export interface PaymentMethodResponse {
  id: string;
  type: "card" | "bank_transfer";
  label: string;
  last4: string;
  expiryDate?: string;
  isDefault: boolean;
}

// ─── UI-Layer Shapes (derived from responses) ────────────────────────────────

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl: string;
  memberSince: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  label: string;
  last4: string;
  expiry?: string;
  isDefault: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "past" | "cancelled";

export interface Booking {
  id: string;
  eventTitle: string;
  vendorName: string;
  eventDate: string;
  bookedOn: string;
  status: BookingStatus;
  amount: number;
  imageUrl: string;
  location: string;
  ticketCount: number;
}

// ─── Request Payloads ────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
}

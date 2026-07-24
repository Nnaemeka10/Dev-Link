// ─── Request Payloads ────────────────────────────────────────────────────────

export interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateNotificationsBody {
  emailPromotions?: boolean;
  smsAlerts?: boolean;
  pushNotifications?: boolean;
  bookingUpdates?: boolean;
}

// ─── Response Shapes ─────────────────────────────────────────────────────────

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
  notifications: NotificationSettingsResponse;
}

export interface NotificationSettingsResponse {
  emailPromotions: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  bookingUpdates: boolean;
}

// ─── Booking Response (mapped to frontend UI shape) ──────────────────────────

export type FrontendBookingStatus = "pending" | "confirmed" | "past" | "cancelled";

export interface BookingHistoryResponse {
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

// ─── Paystack Types ──────────────────────────────────────────────────────────

export interface PaystackAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: "card" | "bank";
  card_type: string;
  bank: string;
  brand: string;
  reusable: boolean;
}

export interface PaymentMethodResponse {
  id: string;               // authorization_code
  type: "card" | "bank_transfer";
  label: string;            // brand or bank name
  last4: string;
  expiryDate?: string;
  isDefault: boolean;
}

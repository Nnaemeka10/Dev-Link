export type ProfileSection = 
  | "personal_info"
  | "bookings"
  | "payments"
  | "security"
  | "notifications";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  joinDate: string;
  isVerified: boolean;
}

export interface BookingHistoryItem {
  id: string;
  title: string;
  date: string;
  status: "upcoming" | "completed" | "cancelled";
  amount: number;
  imageUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_transfer";
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export interface NotificationSettings {
  emailPromotions: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  bookingUpdates: boolean;
}

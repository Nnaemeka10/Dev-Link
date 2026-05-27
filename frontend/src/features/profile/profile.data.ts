import { UserProfile, BookingHistoryItem, PaymentMethod, NotificationSettings } from "./profile.types";

export const MOCK_USER_PROFILE: UserProfile = {
  id: "usr_12345",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  phone: "+234 800 123 4567",
  avatarUrl: "https://i.pravatar.cc/150?u=jane",
  joinDate: "2023-01-15T00:00:00Z",
  isVerified: true,
};

export const MOCK_BOOKING_HISTORY: BookingHistoryItem[] = [
  {
    id: "booking_1",
    title: "The Grand Onyx Pavilion",
    date: "2026-06-15",
    status: "upcoming",
    amount: 2500000,
    imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
  },
  {
    id: "booking_2",
    title: "DJ Spinall Set",
    date: "2026-02-10",
    status: "completed",
    amount: 450000,
    imageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
  },
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "card",
    last4: "4242",
    expiryDate: "12/28",
    isDefault: true,
  },
];

export const MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailPromotions: false,
  smsAlerts: true,
  pushNotifications: true,
  bookingUpdates: true,
};

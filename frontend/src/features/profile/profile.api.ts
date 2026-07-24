import { apiFetch } from "@/lib/api";
import type {
  ProfileResponse,
  BookingResponse,
  PaymentMethodResponse,
  NotificationSettings,
  UpdateProfilePayload,
} from "./profile.types";

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/api/profile", { method: "GET" });
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ─── Avatar Upload Signature ─────────────────────────────────────────────────

export async function fetchAvatarSignature(): Promise<{
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}> {
  return apiFetch("/api/profile/avatar/signature", { method: "GET" });
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function fetchBookings(): Promise<BookingResponse[]> {
  return apiFetch<BookingResponse[]>("/api/profile/bookings", { method: "GET" });
}

// ─── Payment Methods ─────────────────────────────────────────────────────────

export async function fetchPaymentMethods(): Promise<PaymentMethodResponse[]> {
  return apiFetch<PaymentMethodResponse[]>("/api/profile/payment-methods", { method: "GET" });
}

export async function setDefaultPaymentMethod(authCode: string): Promise<void> {
  return apiFetch(`/api/profile/payment-methods/${encodeURIComponent(authCode)}/default`, { method: "PATCH" });
}

export async function removePaymentMethod(authCode: string): Promise<void> {
  return apiFetch(`/api/profile/payment-methods/${encodeURIComponent(authCode)}`, { method: "DELETE" });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function updateNotifications(
  payload: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>("/api/profile/notifications", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ─── Security ────────────────────────────────────────────────────────────────

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return apiFetch("/api/profile/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deactivateAccount(): Promise<void> {
  return apiFetch("/api/profile", { method: "DELETE" });
}

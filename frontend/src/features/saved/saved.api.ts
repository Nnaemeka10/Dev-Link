import { apiFetch } from "@/lib/api";
import type {
  MyBookingItem,
  HubBookingDetails,
  MyReview,
  RefundReason,
  ComplaintCategory,
} from "./saved.types";

export function fetchMyBookings(): Promise<{ bookings: MyBookingItem[] }> {
  return apiFetch("/api/bookings/mine", { method: "GET" });
}

export function fetchHubBookingDetails(bookingId: string): Promise<HubBookingDetails> {
  return apiFetch(`/api/bookings/${bookingId}/hub`, { method: "GET" });
}

export function requestRefund(
  bookingId: string,
  payload: { reason: RefundReason; description: string }
): Promise<{ refundId: string; status: string; message: string }> {
  return apiFetch(`/api/bookings/${bookingId}/refund`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitComplaint(
  bookingId: string,
  payload: { category: ComplaintCategory; subject?: string; message: string }
): Promise<{ complaintId: string; message: string }> {
  return apiFetch(`/api/bookings/${bookingId}/complaint`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMyReview(bookingId: string): Promise<{ review: MyReview | null }> {
  return apiFetch(`/api/bookings/${bookingId}/review`, { method: "GET" });
}

export function submitReview(
  bookingId: string,
  payload: { rating: number; body: string; subRatings: Record<string, number> }
): Promise<{ review: MyReview; message: string }> {
  return apiFetch(`/api/bookings/${bookingId}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

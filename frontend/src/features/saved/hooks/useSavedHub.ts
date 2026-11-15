"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyBookings,
  fetchHubBookingDetails,
  fetchMyReview,
  requestRefund,
  submitComplaint,
  submitReview,
} from "../saved.api";
import type { ComplaintCategory, RefundReason } from "../saved.types";

export const hubKeys = {
  bookings: ["saved-hub", "bookings"] as const,
  details: (id: string) => ["saved-hub", "details", id] as const,
  review: (id: string) => ["saved-hub", "review", id] as const,
};

export function useMyBookings() {
  return useQuery({
    queryKey: hubKeys.bookings,
    queryFn: fetchMyBookings,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useHubBookingDetails(bookingId: string | null) {
  return useQuery({
    queryKey: hubKeys.details(bookingId ?? ""),
    queryFn: () => fetchHubBookingDetails(bookingId!),
    enabled: !!bookingId,
    staleTime: 15_000,
  });
}

export function useMyReview(bookingId: string | null) {
  return useQuery({
    queryKey: hubKeys.review(bookingId ?? ""),
    queryFn: () => fetchMyReview(bookingId!),
    enabled: !!bookingId,
  });
}

function useInvalidateBooking(bookingId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: hubKeys.bookings });
    qc.invalidateQueries({ queryKey: hubKeys.details(bookingId) });
  };
}

export function useRequestRefund(bookingId: string) {
  const invalidate = useInvalidateBooking(bookingId);
  return useMutation({
    mutationFn: (payload: { reason: RefundReason; description: string }) =>
      requestRefund(bookingId, payload),
    onSuccess: invalidate,
  });
}

export function useSubmitComplaint(bookingId: string) {
  const invalidate = useInvalidateBooking(bookingId);
  return useMutation({
    mutationFn: (payload: { category: ComplaintCategory; subject?: string; message: string }) =>
      submitComplaint(bookingId, payload),
    onSuccess: invalidate,
  });
}

export function useSubmitReview(bookingId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateBooking(bookingId);
  return useMutation({
    mutationFn: (payload: { rating: number; body: string; subRatings: Record<string, number> }) =>
      submitReview(bookingId, payload),
    onSuccess: (data) => {
      invalidate();
      qc.setQueryData(hubKeys.review(bookingId), { review: data.review });
      // Listing aggregates changed — refresh any cached listing details.
      qc.invalidateQueries({ queryKey: ["listing"] });
    },
  });
}
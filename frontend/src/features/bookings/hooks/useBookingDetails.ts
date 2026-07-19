import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { BookingDetailsResponse } from "../booking.types";

export function useBookingDetails(bookingId: string | null) {
  return useQuery({
    queryKey: ["booking-details", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const data = await apiFetch<BookingDetailsResponse>(`/api/bookings/${bookingId}`, {
        method: "GET",
        redirectOn401: true,
      });
      return data;
    },
    enabled: !!bookingId,
    staleTime: 1000 * 60 * 5,
  });
}
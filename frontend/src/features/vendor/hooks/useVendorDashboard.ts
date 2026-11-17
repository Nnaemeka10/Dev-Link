// src/features/vendor/hooks/useVendorDashboard.ts
"use client";

import {
  useQuery,
  keepPreviousData,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  BookingDetail,
  BookingFilterKey,
  BookingSortKey,
  BookingsPage,
  DeclineReasonKey,
  MyListingsStats,
  TransactionDetail,
  TransactionsPage,
  VendorDashboardSummary,
  VendorListing,
} from "../types";

export const vendorKeys = {
  summary: ["vendor", "summary"] as const,
  bookings: ["vendor", "bookings"] as const,
  booking: (id: string) => ["vendor", "bookings", "detail", id] as const,
  transactions: ["vendor", "transactions"] as const,
  transaction: (id: string) => ["vendor", "transactions", "detail", id] as const,
  listings: ["vendor", "listings"] as const,
  listingStats: ["vendor", "listings", "stats"] as const,
};

/** 10 rows per page everywhere - matches the numbered pagination UI. */
export const VENDOR_PAGE_SIZE = 10;
/** The dashboard card only ever needs the three most recent payouts. */
export const DASHBOARD_TXN_COUNT = 3;

//  Fetchers 

async function fetchMyListings() {
  return apiFetch<VendorListing[]>("/api/vendor/listings", { method: "GET" });
}

async function fetchSummary() {
  return apiFetch<VendorDashboardSummary>("/api/vendor/dashboard/summary", { method: "GET" });
}

async function fetchTransactions(page: number, perPage: number) {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return apiFetch<TransactionsPage>(`/api/vendor/transactions?${params.toString()}`, {
    method: "GET",
  });
}

async function fetchTransaction(id: string) {
  return apiFetch<TransactionDetail>(`/api/vendor/transactions/${id}`, { method: "GET" });
}

async function fetchBookings(
  filter: BookingFilterKey,
  page: number,
  sort: BookingSortKey,
  perPage: number
) {
  const params = new URLSearchParams({
    filter,
    page: String(page),
    sort,
    perPage: String(perPage),
  });
  return apiFetch<BookingsPage>(`/api/vendor/bookings?${params.toString()}`, { method: "GET" });
}

async function fetchBooking(id: string) {
  return apiFetch<BookingDetail>(`/api/vendor/bookings/${id}`, { method: "GET" });
}

async function fetchMyListingsStats() {
  return apiFetch<MyListingsStats>("/api/vendor/listings/stats", { method: "GET" });
}

async function confirmBooking(bookingId: string) {
  return apiFetch<{ bookingId: string; status: string; message: string }>(
    `/api/vendor/bookings/${bookingId}/confirm`,
    { method: "PATCH" }
  );
}

async function declineBooking(payload: {
  bookingId: string;
  reason: DeclineReasonKey;
  note?: string;
}) {
  return apiFetch<{ bookingId: string; status: string; refundStatus: string; message: string }>(
    `/api/vendor/bookings/${payload.bookingId}/decline`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason: payload.reason, note: payload.note }),
    }
  );
}

//  Queries 

export function useVendorSummary() {
  return useQuery({
    queryKey: vendorKeys.summary,
    queryFn: fetchSummary,
    staleTime: 30_000,
  });
}

export function useVendorTransactions(page = 1, perPage = VENDOR_PAGE_SIZE) {
  return useQuery({
    queryKey: [...vendorKeys.transactions, page, perPage],
    queryFn: () => fetchTransactions(page, perPage),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useVendorTransaction(id: string | null) {
  return useQuery({
    queryKey: vendorKeys.transaction(id ?? ""),
    queryFn: () => fetchTransaction(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useVendorBookings(
  filter: BookingFilterKey,
  page: number,
  sort: BookingSortKey = "newest",
  perPage = VENDOR_PAGE_SIZE
) {
  return useQuery({
    queryKey: [...vendorKeys.bookings, filter, page, sort, perPage],
    queryFn: () => fetchBookings(filter, page, sort, perPage),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useVendorBooking(id: string | null) {
  return useQuery({
    queryKey: vendorKeys.booking(id ?? ""),
    queryFn: () => fetchBooking(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useVendorListings() {
  return useQuery({ queryKey: vendorKeys.listings, queryFn: fetchMyListings });
}

export function useMyListingsStats() {
  return useQuery({ queryKey: vendorKeys.listingStats, queryFn: fetchMyListingsStats });
}

//  Mutations 

/**
 * A decision moves money: refresh every booking page/filter, the summary
 * cards, the payout ledger and the specific detail page.
 */
function useInvalidateAfterDecision(bookingId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: vendorKeys.bookings });
    queryClient.invalidateQueries({ queryKey: vendorKeys.summary });
    queryClient.invalidateQueries({ queryKey: vendorKeys.transactions });
    queryClient.invalidateQueries({ queryKey: vendorKeys.booking(bookingId) });
  };
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmBooking,
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.bookings });
      queryClient.invalidateQueries({ queryKey: vendorKeys.summary });
      queryClient.invalidateQueries({ queryKey: vendorKeys.booking(bookingId) });
    },
  });
}

export function useDeclineBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: declineBooking,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.bookings });
      queryClient.invalidateQueries({ queryKey: vendorKeys.summary });
      queryClient.invalidateQueries({ queryKey: vendorKeys.transactions });
      queryClient.invalidateQueries({ queryKey: vendorKeys.booking(variables.bookingId) });
    },
  });
}

/** Exported for pages that mutate outside the hooks above. */
export { useInvalidateAfterDecision };
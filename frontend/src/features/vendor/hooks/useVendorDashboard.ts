// src/features/vendor/hooks/useVendorDashboard.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { 
    BookingRecord, 
    PaginationState, 
    VendorDashboardSummary, 
    Transaction, 
    MyListingsStats,
    VendorListing
 } from "../types";


// API Fetchers

async function fetchMyListings() {
  return apiFetch<VendorListing[]>("/api/vendor/listings", { method: "GET" });
}

export function useVendorListings() {
  return useQuery({ queryKey: ["vendor", "listings"], queryFn: fetchMyListings });
}


async function fetchSummary() {
  return apiFetch<VendorDashboardSummary>("/api/vendor/dashboard/summary", { method: "GET" });
}

async function fetchTransactions() {
  return apiFetch<Transaction[]>("/api/vendor/dashboard/transactions", { method: "GET" });
}

async function fetchBookings(filter: string, page: number) {
  return apiFetch<{ bookings: BookingRecord[]; pagination: PaginationState }>(
    `/api/vendor/bookings?filter=${filter}&page=${page}`,
    { method: "GET" }
  );
}

async function fetchMyListingsStats() {
  return apiFetch<MyListingsStats>("/api/vendor/listings/stats", { method: "GET" });
}

// ─── React Query Hooks ─────────────────────────────────────────────────────
export function useVendorSummary() {
  return useQuery({ queryKey: ["vendor", "summary"], queryFn: fetchSummary });
}

export function useVendorTransactions() {
  return useQuery({ queryKey: ["vendor", "transactions"], queryFn: fetchTransactions });
}

export function useVendorBookings(filter: string, page: number) {
  return useQuery({
    queryKey: ["vendor", "bookings", filter, page],
    queryFn: () => fetchBookings(filter, page),
    placeholderData: keepPreviousData,
  });
}

export function useMyListingsStats() {
  return useQuery({ queryKey: ["vendor", "listings", "stats"], queryFn: fetchMyListingsStats });
}
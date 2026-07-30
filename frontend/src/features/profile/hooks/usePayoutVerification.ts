import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface BankDirectoryItem {
  id: number;
  name: string;
  code: string;
}

export interface PayoutMethodStatus {
  status: "unregistered" | "pending" | "verified" | "manual_review" | "failed";
  resolvedAccountName?: string | null;
  idType?: string | null;
  idLast4?: string | null;
  accountLast4?: string | null;
  bankCode?: string | null;
}

export interface PayoutMethodPayload {
  bankCode: string;
  accountNumber: string;
  legalFirstName: string;
  legalLastName: string;
  idType: "bvn" | "nin";
  idNumber: string;
}

// ─── API Fetchers ──────────────────────────────────────────────────────────

async function fetchBanks(): Promise<BankDirectoryItem[]> {
  return apiFetch<BankDirectoryItem[]>("/api/vendor/verification/banks", { method: "GET" });
}

async function fetchPayoutStatus(): Promise<PayoutMethodStatus> {
  return apiFetch<PayoutMethodStatus>("/api/vendor/verification/payout-method/status", { method: "GET" });
}

async function submitPayoutMethod(payload: PayoutMethodPayload): Promise<{ status: string; message: string }> {
  return apiFetch("/api/vendor/verification/payout-method", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function removePayoutMethod(): Promise<void> {
  return apiFetch("/api/vendor/verification/payout-method", { method: "DELETE" });
}

// React Query Hooks 

export function useBankDirectory() {
  return useQuery({
    queryKey: ["vendor", "banks"],
    queryFn: fetchBanks,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });
}

export function usePayoutMethodStatus() {
  return useQuery({
    queryKey: ["vendor", "payout-method", "status"],
    queryFn: fetchPayoutStatus,
    // Poll every 10 seconds if status is 'pending'
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" ? 10000 : false;
    },
  });
}

export function useSubmitPayoutMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitPayoutMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", "payout-method", "status"] });
    },
  });
}

export function useRemovePayoutMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removePayoutMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", "payout-method", "status"] });
    },
  });
}
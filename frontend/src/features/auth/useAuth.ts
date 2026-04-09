"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "./auth.store";
import type { AuthUser } from "@/types/auth";

interface MeResponse {
  user: AuthUser;
}

export function useAuth() {
  const { isAuthenticated, user, loading, setAuth, clearAuth, setLoading } = useAuthStore();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<MeResponse>("/api/auth/me", { method: "GET", redirectOn401: false }),
    retry: false,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (meQuery.isPending) {
      setLoading(true);
      return;
    }

    if (meQuery.isError) {
      clearAuth();
      return;
    }

    if (meQuery.data?.user) {
      setAuth({ isAuthenticated: true, user: meQuery.data.user });
    } else {
      clearAuth();
    }
  }, [clearAuth, meQuery.data, meQuery.isError, meQuery.isPending, setAuth, setLoading]);

  return {
    isAuthenticated,
    user,
    loading,
    refetchAuth: meQuery.refetch,
  };
}

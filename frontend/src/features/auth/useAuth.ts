"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "./auth.store";
import type { AuthUser } from "@/types/auth";

interface MeResponse {
  user: AuthUser;
}

export function useAuth() {
  const { isAuthenticated, user, loading, setAuth, clearAuth, setLoading } = useAuthStore();

  const queryClient = useQueryClient();


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

    if (meQuery.isError || !meQuery.data?.user) {
      clearAuth();
      return;
    }

   
      setAuth({ isAuthenticated: true, user: meQuery.data.user });
   

  }, [clearAuth, meQuery.data, meQuery.isError, meQuery.isPending, setAuth, setLoading]);

  return {
    isAuthenticated,
    user,
    loading,
    refetchAuth: meQuery.refetch,
    clearAuth,
    queryClient,
  };
}

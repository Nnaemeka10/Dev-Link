import { create } from "zustand";
import type { AuthState, AuthUser } from "@/types/auth";

interface AuthActions {
  setLoading: (loading: boolean) => void;
  setAuth: (payload: { isAuthenticated: boolean; user: AuthUser | null }) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: true,
  setLoading: (loading) => set({ loading }),
  setAuth: ({ isAuthenticated, user }) => set({ isAuthenticated, user, loading: false }),
  clearAuth: () => set({ isAuthenticated: false, user: null, loading: false }),
}));

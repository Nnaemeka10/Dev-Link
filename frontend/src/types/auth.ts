export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  isVerified?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
}

export interface ApiErrorPayload {
  message?: string;
  [key: string]: unknown;
}

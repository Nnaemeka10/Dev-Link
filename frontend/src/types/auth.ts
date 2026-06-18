export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  headline?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  isEmailVerified: boolean;
  isActive: boolean;
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

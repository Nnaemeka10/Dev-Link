export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  headline?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  /** Primary location from the profile (null until the user sets it). */
  location?: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl?: string;
  /**
   * Derived server-side on /api/auth/me: true when the user has a published
   * or pending-review listing. Drives the contextual vendor/client switch.
   * Older cached payloads may not carry it - treat undefined as false.
   */
  isVendor?: boolean;
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
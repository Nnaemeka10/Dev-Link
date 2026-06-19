export type AuthMode = "login" | "signup" | "reset";
export type SignupIntent = "booker" | "vendor";

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  password: string;
  dateOfBirth: string;
}


// Add to auth.types.ts

export interface ResetPasswordFormValues {
  email: string;
}

export interface VerifyResetOtpResponse {
  message: string;
  sessionToken: string;
  sessionExpiresAt: string;
}

export interface ForgotPasswordResponse {
  message: string;
  expiresAt: string;
}

export interface SetNewPasswordFormValues {
  inewPassword: string;
  iconfirmPassword: string;
}
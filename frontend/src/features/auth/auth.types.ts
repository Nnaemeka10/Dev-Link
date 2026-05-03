export type AuthMode = "login" | "signup" | "reset";
export type SignupIntent = "booker" | "vendor";

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  email: string;
  fullName: string;
  intent: SignupIntent;
  password: string;
}

export interface ResetPasswordFormValues {
  email: string;
}

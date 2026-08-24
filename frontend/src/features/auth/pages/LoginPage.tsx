"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiFetch, ApiError } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import { useAuthStore } from "../auth.store";
import type { LoginFormValues } from "../auth.types";
import { getSafeReturnTo, withReturnTo } from "../auth.utils";
import { AuthInput, Divider } from "../components/AuthFields";
import AuthShell from "../components/AuthShell";
import OtpVerifyModal from "../components/OtpVerifyModal";
import { useGoogleLogin } from "@react-oauth/google";

interface MeResponse {
  user: AuthUser;
}


interface LoginResponse {
  requiresVerification?: boolean;
  expiresAt: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });


  const googleLogin = useGoogleLogin({
    scope: "openid email profile", // REQUIRED to get the ID Token
    onSuccess: async (tokenResponse) => {
      setError(null);
      setGoogleLoading(true);
      try {
        // Cast to any to access id_token (it exists at runtime but is missing from the TS types)
        const idToken = (tokenResponse as { id_token?: string }).id_token;
        if (!idToken) {
          throw new Error("Failed to retrieve Google ID Token.");
        }

        const response = await apiFetch<{ user: AuthUser }>("/api/auth/google", {
          method: "POST",
          body: JSON.stringify({ credential: idToken }),
          redirectOn401: false,
        });

        setAuth({ isAuthenticated: true, user: response.user });
        router.replace(getSafeReturnTo(returnTo));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to sign in with Google.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google authentication failed. Please try again.");
      setGoogleLoading(false);
    },
  });


  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      const response = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ iemail: values.email, ipassword: values.password }),
        redirectOn401: false,
      });

      if (response.requiresVerification) {
        setSubmittedEmail(values.email);
        setExpiresAt(response.expiresAt);
        setModalOpen(true);
        return;
      }
      

      const me = await apiFetch<MeResponse>("/api/auth/me", {
        method: "GET",
        redirectOn401: false,
      });



      setAuth({ isAuthenticated: true, user: me.user });
      router.replace(getSafeReturnTo(returnTo));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in.");
    }
  });

  const handleVerified = (user: AuthUser) => {
    setModalOpen(false);
    setAuth({ isAuthenticated: true, user });
    router.replace(getSafeReturnTo(returnTo));
  };

  return (
    <AuthShell>
      <section className="w-full max-w-160 rounded-[2.25rem] bg-white px-6 py-10 shadow-[0_24px_70px_rgba(34,27,18,0.08)] md:px-14 md:py-16">
        <div className="text-center">
          <h1 className="text-heading-m font-extrabold tracking-[-0.03em] md:text-5xl">Welcome Back</h1>
          <p className="mt-4 md:text-lg text-small text-[#555B7F]">Sign in to curate your next extraordinary event</p>
        </div>

       <div className="mt-10 flex justify-center">
          <button 
            type="button" 
            onClick={() => googleLogin()} 
            disabled={googleLoading}
            className="flex items-center justify-center gap-3 w-full rounded-full border border-[#EFE0D8] px-6 py-4 font-extrabold text-tiny md:text-sm hover:bg-[#FAF7F2] transition-colors disabled:opacity-60"
          >
            {googleLoading ? "Connecting..." : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.61 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.09-.4-4.55H24v9.02h12.94c-.56 2.96-2.24 5.48-4.77 7.18l7.72 6c4.51-4.16 7.09-10.29 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.54 28.59A14.47 14.47 0 0 1 9.5 24c0-1.59.36-3.13 1.04-4.59l-7.98-6.19A23.93 23.93 0 0 0 0 24c0 3.87.92 7.53 2.56 10.78l7.98-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.91-2.14 15.89-5.8l-7.72-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-3.58-13.46-8.91l-7.98 6.19C6.51 42.62 14.61 48 24 48z"></path>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>


        <div className="my-10">
          <Divider label="Or Email" />
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          <AuthInput
            label="Email Address"
            type="email"
            placeholder="e.g. adeyemi@curated.ng"
            autoComplete="email"
            error={formState.errors.email?.message}
            {...register("email", { required: "Email is required" })}
          />
            <AuthInput
              label="Password"
              rightIcon="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={formState.errors.password?.message}
              {...register("password", { required: "Password is required" })}
            />
          
          {error ? <p className="text-sm font-semibold text-[#B9401D]">{error}</p> : null}

          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="w-full rounded-full bg-[#B9401D] px-8 py-5 text-small md:text-lg font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] disabled:opacity-60"
          >
            {formState.isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-10 text-center text-tiny md:text-base text-[#555B7F]">
          Don&apos;t have an account?{" "}
          <Link href={withReturnTo("/signup", returnTo)} className="font-extrabold text-[#252423]">
            Sign Up
          </Link>
        </p>
      </section>

       <OtpVerifyModal
                   
                    open={modalOpen}
                    email={submittedEmail}
                    expiresAt={expiresAt}
                    onClose={() => setModalOpen(false)}
                    onVerify={async(code)=>{
                      const response = await apiFetch<{user:AuthUser}>(
                        "/api/auth/verify-email",
                        {
                          method:"POST",
                          body:JSON.stringify({
                              email: submittedEmail,
                              code
                          }),
                          redirectOn401:false
                        }
                      );
      
                      handleVerified(response.user);
                    }}
      
                    onResend={async()=>{
      
                      return await apiFetch(
                        "/api/auth/send-verification-email",
                        {
                          method:"POST",
                          body:JSON.stringify({
                              email:submittedEmail
                          })
                        }
                      );
      
                    }}
      
            />
    </AuthShell>
  );
}

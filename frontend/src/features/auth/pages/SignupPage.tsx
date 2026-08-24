"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGoogleLogin } from "@react-oauth/google";
import { apiFetch, ApiError } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import { useAuthStore } from "../auth.store";
import type { SignupFormValues } from "../auth.types";
import { getSafeReturnTo, withReturnTo } from "../auth.utils";
import { AuthInput, Divider, SecurePill } from "../components/AuthFields";
import AuthShell from "../components/AuthShell";
import OtpVerifyModal from "../components/OtpVerifyModal";

interface SignupResponse {
  // user: AuthUser;
  message: string;
  expiresAt: string;
}



export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const setAuth = useAuthStore((state) => state.setAuth);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const { register, handleSubmit, formState } = useForm<SignupFormValues>({
    defaultValues: { email: "", firstName: "", lastName: "", username: "", dateOfBirth: "", password: "" },
  });
 
  // Google Signup/Login Handler
  const googleSignup = useGoogleLogin({
    scope: "email profile",
    onSuccess: async (tokenResponse) => {
      setError(null);
      setGoogleLoading(true);
      try {
        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
          throw new Error("Failed to retrieve Google access token.");
        }

        const response = await apiFetch<{ user: AuthUser }>("/api/auth/google", {
          method: "POST",
          body: JSON.stringify({ accessToken }),
          redirectOn401: false,
        });

        setAuth({ isAuthenticated: true, user: response.user });
        router.replace(getSafeReturnTo(returnTo));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to sign up with Google.");
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
      const response = await apiFetch<SignupResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          ifirstname: values.firstName,
          ilastname: values.lastName,
          iemail: values.email,
          ipassword: values.password,
          idateOfBirth: values.dateOfBirth,
          iusername: values.username,
        }),
        redirectOn401: false,
      });

  
      setSubmittedEmail(values.email);
      setExpiresAt(response.expiresAt);
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create account.");
    }
  });

  const handleVerified = (user: AuthUser) => {
    setModalOpen(false);
    setAuth({ isAuthenticated: true, user });
    router.replace(getSafeReturnTo(returnTo));
  };

  return (
    <AuthShell variant="split">
      <section className="w-full">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-heading-m font-extrabold tracking-[-0.03em] md:text-3xl lg:text-4xl">Create your account</h1>
          <p className="mt-2 text-small text-[#555B7F] md:mt-3 md:text-base">Join our digital concierge for the Nigerian events industry.</p>


          <div className="mt-6 flex justify-center md:mt-8">
            <button 
              type="button" 
              onClick={() => googleSignup()} 
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

          <div className="my-6 md:my-8 lg:my-10">
            <Divider label="Or signup with" />
          </div>



          <form className="mt-6 space-y-5 md:mt-8 md:space-y-6 lg:mt-10 lg:space-y-7" onSubmit={onSubmit}>

             <AuthInput
              label="Email Address"
              type="email"
              placeholder="ebuka@example.com"
              autoComplete="email"
              error={formState.errors.email?.message}
              {...register("email", { required: "Email is required" })}
            />

            <AuthInput
              label="First Name"
              placeholder="Ebuka"
              autoComplete="given-name"
              error={formState.errors.firstName?.message}
              {...register("firstName", { required: "First name is required" })}
            />
            <AuthInput
              label="Last Name"
              placeholder="Obi-Uchendu"
              autoComplete="family-name"
              error={formState.errors.lastName?.message}
              {...register("lastName", { required: "Last name is required" })}
            />
            
            <AuthInput
              label="Username (optional)"
              placeholder="ebuka123"
              autoComplete="username"
              error={formState.errors.username?.message}
              {...register("username")}
            />

            <AuthInput
              label="Date of Birth"
              type="date"
              placeholder="1990-01-01"
              autoComplete="bday"
              error={formState.errors.dateOfBirth?.message}
              {...register("dateOfBirth", { required: "Date of birth is required" })}
            />
            <AuthInput
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              rightIcon="password"
              error={formState.errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
            />

            {error ? <p className="text-xs font-semibold text-[#B9401D] md:text-sm">{error}</p> : null}

            <button
              type="submit"
              disabled={formState.isSubmitting}
              className="w-full rounded-full bg-[#B9401D] px-6 py-4 text-small font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] disabled:opacity-60 md:px-8 md:py-5 md:text-lg"
            >
              {formState.isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </form>

                   
          <div className="mt-8 text-center md:mt-10 text-small">
            <p className="text-[#555B7F]">
              Already have an account?{" "}
              <Link href={withReturnTo("/login", returnTo)} className="font-extrabold text-[#B9401D]">
                Sign In
              </Link>
            </p>
            <div className="mt-5">
              <SecurePill />
            </div>
          </div>
        </div>
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

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const { register, handleSubmit, formState } = useForm<SignupFormValues>({
    defaultValues: { email: "", firstName: "", lastName: "", username: "", dateOfBirth: "", password: "" },
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

      // setAuth({ isAuthenticated: true, user: signup.user });
      // router.replace(getSafeReturnTo(returnTo));
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
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-3xl lg:text-4xl">Create your account</h1>
          <p className="mt-2 text-sm text-[#555B7F] md:mt-3 md:text-base">Join our digital concierge for the Nigerian events industry.</p>


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
              className="w-full rounded-full bg-[#B9401D] px-6 py-4 text-base font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] disabled:opacity-60 md:px-8 md:py-5 md:text-lg"
            >
              {formState.isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="my-6 md:my-8 lg:my-10">
            <Divider label="Or sign up with" />
          </div>

          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            <button type="button" className="rounded-full bg-[#F4F1EA] px-4 py-3 text-sm font-extrabold md:px-6 md:py-4 md:text-base">Google</button>
            <button type="button" className="rounded-full bg-[#F4F1EA] px-4 py-3 text-sm font-extrabold md:px-6 md:py-4 md:text-base">Apple</button>
          </div>

          <div className="mt-8 text-center md:mt-10">
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

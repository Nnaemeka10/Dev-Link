"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiFetch, ApiError } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import { useAuthStore } from "../auth.store";
import type { SignupFormValues, SignupIntent } from "../auth.types";
import { getSafeReturnTo, withReturnTo } from "../auth.utils";
import { AuthInput, Divider, SecurePill } from "../components/AuthFields";
import AuthShell from "../components/AuthShell";

interface SignupResponse {
  user: AuthUser;
}



export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<SignupFormValues>({
    defaultValues: { email: "", fullName: "", intent: "booker", password: "" },
  });
 

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      const signup = await apiFetch<SignupResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          ifullname: values.fullName,
          iemail: values.email,
          ipassword: values.password,
          irole: values.intent === "vendor" ? "employer" : "candidate",
        }),
        redirectOn401: false,
      });

      setAuth({ isAuthenticated: true, user: signup.user });
      router.replace(getSafeReturnTo(returnTo));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create account.");
    }
  });

  return (
    <AuthShell variant="split">
      <section className="w-full">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-3xl lg:text-4xl">Create your account</h1>
          <p className="mt-2 text-sm text-[#555B7F] md:mt-3 md:text-base">Join our digital concierge for the Nigerian events industry.</p>


          <form className="mt-6 space-y-5 md:mt-8 md:space-y-6 lg:mt-10 lg:space-y-7" onSubmit={onSubmit}>
            <AuthInput
              label="Full Name"
              placeholder="Ebuka Obi-Uchendu"
              autoComplete="name"
              error={formState.errors.fullName?.message}
              {...register("fullName", { required: "Full name is required" })}
            />
            <AuthInput
              label="Email Address"
              type="email"
              placeholder="ebuka@example.com"
              autoComplete="email"
              error={formState.errors.email?.message}
              {...register("email", { required: "Email is required" })}
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
    </AuthShell>
  );
}

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

const INTENTS: Array<{ id: SignupIntent; label: string }> = [
  { id: "booker", label: "Book Events" },
  { id: "vendor", label: "Provide Services" },
];

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState } = useForm<SignupFormValues>({
    defaultValues: { email: "", fullName: "", intent: "booker", password: "" },
  });
  const intent = watch("intent");

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
        <div className="mx-auto max-w-[42rem]">
          <h1 className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Create your account</h1>
          <p className="mt-3 text-lg text-[#555B7F]">Join our digital concierge for the Nigerian events industry.</p>

          <div className="mt-10 grid grid-cols-2 gap-4 rounded-[2rem]">
            {INTENTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setValue("intent", option.id)}
                className={`rounded-full px-6 py-5 font-extrabold ${
                  intent === option.id ? "bg-[#FFDFA7] text-[#252423]" : "bg-[#E0DDD6] text-[#252423]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form className="mt-10 space-y-7" onSubmit={onSubmit}>
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

            {error ? <p className="text-sm font-semibold text-[#B9401D]">{error}</p> : null}

            <button
              type="submit"
              disabled={formState.isSubmitting}
              className="w-full rounded-full bg-[#B9401D] px-8 py-5 text-lg font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] disabled:opacity-60"
            >
              {formState.isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="my-10">
            <Divider label="Or sign up with" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button type="button" className="rounded-full bg-[#F4F1EA] px-6 py-4 font-extrabold">Google</button>
            <button type="button" className="rounded-full bg-[#F4F1EA] px-6 py-4 font-extrabold">Apple</button>
          </div>

          <div className="mt-10 text-center">
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

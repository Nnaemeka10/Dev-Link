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

interface MeResponse {
  user: AuthUser;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ iemail: values.email, ipassword: values.password }),
        redirectOn401: false,
      });

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

  return (
    <AuthShell>
      <section className="w-full max-w-[40rem] rounded-[2.25rem] bg-white px-6 py-10 shadow-[0_24px_70px_rgba(34,27,18,0.08)] md:px-14 md:py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Welcome Back</h1>
          <p className="mt-4 text-lg text-[#555B7F]">Sign in to curate your next extraordinary event</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <button type="button" className="rounded-full border border-[#EFE0D8] px-6 py-4 font-extrabold">Google</button>
          <button type="button" className="rounded-full border border-[#EFE0D8] px-6 py-4 font-extrabold">Facebook</button>
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
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#3F211B]">Password</span>
              <Link href={withReturnTo("/forgot-password", returnTo)} className="text-sm font-extrabold text-[#B9401D]">
                Forgot Password?
              </Link>
            </div>
            <AuthInput
              label=""
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={formState.errors.password?.message}
              {...register("password", { required: "Password is required" })}
            />
          </div>

          {error ? <p className="text-sm font-semibold text-[#B9401D]">{error}</p> : null}

          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="w-full rounded-full bg-[#B9401D] px-8 py-5 text-lg font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] disabled:opacity-60"
          >
            {formState.isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-10 text-center text-base text-[#555B7F]">
          Don&apos;t have an account?{" "}
          <Link href={withReturnTo("/signup", returnTo)} className="font-extrabold text-[#252423]">
            Sign Up
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}

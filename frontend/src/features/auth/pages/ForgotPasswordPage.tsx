"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiFetch, ApiError } from "@/lib/api";
import type { ResetPasswordFormValues } from "../auth.types";
import { AuthInput } from "../components/AuthFields";
import AuthShell from "../components/AuthShell";
import { ArrowLeftIcon } from "lucide-react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ResetPasswordFormValues>({
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch<{ message?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: values.email }),
        redirectOn401: false,
      });

      setMessage(response.message ?? "If an account exists, reset instructions will be sent.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to send reset instructions.");
    }
  });

  return (
    <AuthShell>
      <section className="w-full max-w-[35rem] rounded-[2.25rem] bg-white px-6 py-10 shadow-[0_24px_70px_rgba(34,27,18,0.08)] md:px-14 md:py-16">
        <div className="text-center">
          <h1 className="md:text-4xl text-2xl font-extrabold tracking-[-0.03em]">Reset Password</h1>
          <p className="mt-4 md:text-lg text-sm leading-7 text-[#555B7F]">Enter your email to receive reset instructions</p>
        </div>

        <form className="mt-10 space-y-7" onSubmit={onSubmit}>
          <AuthInput
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            error={formState.errors.email?.message}
            {...register("email", { required: "Email is required" })}
          />

          {message ? <p className="text-sm font-semibold text-[#2C6E49]">{message}</p> : null}
          {error ? <p className="text-sm font-semibold text-[#B9401D]">{error}</p> : null}

          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="w-full rounded-full bg-[#B9401D] px-8 py-5 md:text-lg text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] disabled:opacity-60"
          >
            {formState.isSubmitting ? "Sending..." : "Get Token"}
          </button>
        </form>

        <div className="mt-10 border-t border-[#EFE8DE] pt-8 text-center flex items-center justify-center gap-1">
          <ArrowLeftIcon/>
          <Link href="/login" className="font-semibold text-[#6B5F57]">
              
             Back to Login
          </Link>

        </div>
      </section>
    </AuthShell>
  );
}

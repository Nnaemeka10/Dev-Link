"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { apiFetch, ApiError } from "@/lib/api";
import type { SetNewPasswordFormValues } from "../auth.types";
import { AuthInput } from "../components/AuthFields";
import AuthShell from "../components/AuthShell";
import { ArrowLeftIcon, CheckCircle2Icon, ShieldAlertIcon } from "lucide-react";

// -------------------------------------------------------------------
// We read searchParams inside a child so the page is Suspense-safe
// (Next.js App Router requires useSearchParams to be wrapped)
// -------------------------------------------------------------------

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // either ?session= (OTP path) or ?token= (email link path)
  const sessionToken = searchParams.get("session");
  const linkToken = searchParams.get("token");

  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  const { register, handleSubmit, formState, watch } = useForm<SetNewPasswordFormValues>({
    defaultValues: { inewPassword: "", iconfirmPassword: "" },
  });

  const password = watch("inewPassword");

  // Guard: no token at all → reject immediately
  useEffect(() => {
    if (!sessionToken && !linkToken) {
      setTokenInvalid(true);
    }
  }, [sessionToken, linkToken]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const body: Record<string, string> = {
      inewPassword: values.inewPassword,
      iconfirmPassword: values.iconfirmPassword,
    };

    if (sessionToken) body.sessionToken = sessionToken;
    else if (linkToken) body.token = linkToken;

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(body),
        redirectOn401: false,
      });

      setSuccess(true);

      // auto-navigate to login after 3 s so the user has time to read the success state
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { error?: string } | undefined;
        const msg = data?.error ?? err.message;

        if (
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("expired")
        ) {
          setTokenInvalid(true);
        } else {
          setFormError(msg);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  });

  // ── Invalid / missing token ──────────────────────────────────────
  if (tokenInvalid) {
    return (
      <section className="w-full max-w-140 rounded-[2.25rem] bg-white px-6 py-10 shadow-[0_24px_70px_rgba(34,27,18,0.08)] md:px-14 md:py-16">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBEFEA]">
            <ShieldAlertIcon className="h-8 w-8 text-[#B9401D]" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold tracking-[-0.03em] md:text-[1.875rem]">
            Link invalid or expired
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#555B7F] md:text-base">
            This password reset link has already been used, expired, or is malformed. Reset links are valid for 1 hour and can only be used once.
          </p>
          <Link
            href="/forgot-password"
            className="mt-8 inline-block w-full rounded-full bg-[#B9401D] px-8 py-5 text-center text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] md:text-lg"
          >
            Request a new code
          </Link>
          <div className="mt-8 border-t border-[#EFE8DE] pt-7 flex items-center justify-center gap-1 w-full">
            <ArrowLeftIcon className="h-4 w-4 text-[#6B5F57]" />
            <Link href="/login" className="font-semibold text-[#6B5F57]">
              Back to Login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Success state ────────────────────────────────────────────────
  if (success) {
    return (
      <section className="w-full max-w-140 rounded-[2.25rem] bg-white px-6 py-10 shadow-[0_24px_70px_rgba(34,27,18,0.08)] md:px-14 md:py-16">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF4EE]">
            <CheckCircle2Icon className="h-8 w-8 text-[#2C6E49]" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold tracking-[-0.03em] md:text-[1.875rem]">
            Password updated
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#555B7F] md:text-base">
            Your password has been changed successfully. You&apos;ll be taken to the login page in a moment.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block w-full rounded-full bg-[#B9401D] px-8 py-5 text-center text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] md:text-lg"
          >
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  // ── Main form ────────────────────────────────────────────────────
  return (
    <section className="w-full max-w-140 rounded-[2.25rem] bg-white px-6 py-10 shadow-[0_24px_70px_rgba(34,27,18,0.08)] md:px-14 md:py-16">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-4xl">
          New Password
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#555B7F] md:text-lg">
          Choose a strong password for your account
        </p>
      </div>

      {/* Path badge — subtle hint of which flow they're on */}
      <div className="mt-6 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F2EA] px-3 py-1 text-xs font-semibold text-[#6B5F57]">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: sessionToken ? "#2C6E49" : "#B9401D" }}
            aria-hidden="true"
          />
          {sessionToken ? "Verified via code" : "Verified via email link"}
        </span>
      </div>

      <form className="mt-8 space-y-7" onSubmit={onSubmit}>
        <div>
          <AuthInput
            label="New Password"
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            error={formState.errors.inewPassword?.message}
            {...register("inewPassword", {
              required: "Password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            })}
          />
          {/* Strength hint bar */}
          {password.length > 0 && (
            <StrengthBar password={password} />
          )}
        </div>

        <AuthInput
          label="Confirm Password"
          type="password"
          placeholder="Repeat your new password"
          autoComplete="new-password"
          error={formState.errors.iconfirmPassword?.message}
          {...register("iconfirmPassword", {
            required: "Please confirm your password",
            validate: (val) => val === password || "Passwords do not match",
          })}
        />

        {formError ? (
          <p className="text-sm font-semibold text-[#B9401D]">{formError}</p>
        ) : null}

        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded-full bg-[#B9401D] px-8 py-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(185,64,29,0.2)] disabled:opacity-60 md:text-lg"
        >
          {formState.isSubmitting ? "Saving..." : "Set New Password"}
        </button>
      </form>

      <div className="mt-10 border-t border-[#EFE8DE] pt-8 flex items-center justify-center gap-1 text-center">
        <ArrowLeftIcon className="h-4 w-4 text-[#6B5F57]" />
        <Link href="/login" className="font-semibold text-[#6B5F57]">
          Back to Login
        </Link>
      </div>
    </section>
  );
}

// ── Password strength bar ──────────────────────────────────────────
function getStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 1) return { level: 0, label: "Weak" };
  if (score === 2) return { level: 1, label: "Fair" };
  if (score === 3) return { level: 2, label: "Good" };
  return { level: 3, label: "Strong" };
}

const STRENGTH_COLORS = ["#B9401D", "#D97A2A", "#2C6E49", "#2C6E49"] as const;
const SEGMENT_COUNT = 4;

function StrengthBar({ password }: { password: string }) {
  const { level, label } = getStrength(password);
  const color = STRENGTH_COLORS[level];

  return (
    <div className="mt-2.5" aria-live="polite" aria-label={`Password strength: ${label}`}>
      <div className="flex gap-1.5">
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= level ? color : "#EFE8DE",
            }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-right text-xs font-semibold" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ────────────
export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <section className="w-full max-w-140 rounded-[2.25rem] bg-white px-6 py-10 shadow-[0_24px_70px_rgba(34,27,18,0.08)] md:px-14 md:py-16">
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-[#B9401D] border-t-transparent animate-spin" />
            </div>
          </section>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/features/auth/auth.store";
import type { AuthUser } from "@/types/auth";

interface LoginFormData {
  email: string;
  password: string;
}

interface MeResponse {
  user: AuthUser;
}

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
        redirectOn401: false,
      });

      const me = await apiFetch<MeResponse>("/api/auth/me", {
        method: "GET",
        redirectOn401: false,
      });

      setAuth({ isAuthenticated: true, user: me.user });
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in.";
      setError(message);
    }
  });

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center px-4 py-8 md:px-6 md:py-12">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-text-primary">Welcome back</h1>
        <p className="mt-2 text-sm text-text-primary/75">
          Sign in with your account to continue planning with eventvnv.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register("email", { required: "Email is required" })}
            error={formState.errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="********"
            autoComplete="current-password"
            {...register("password", { required: "Password is required" })}
            error={formState.errors.password?.message}
          />

          {error ? <p className="text-sm text-accent-primary">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

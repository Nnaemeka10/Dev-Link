"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { getCurrentReturnTo, withReturnTo } from "./auth.utils";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading || isAuthenticated) return;

    // Send the user back to exactly where they were after login/signup.
    // window.location (not useSearchParams) on purpose: several pages mount
    // AuthGuard without a Suspense boundary (/profile, /vendor/*), and
    // useSearchParams would break their prerender. The redirect only ever
    // runs client-side, so reading location here is safe.
    const returnTo = getCurrentReturnTo();
    router.replace(withReturnTo("/login", returnTo));
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-text-primary/70">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
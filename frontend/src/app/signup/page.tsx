import { Suspense } from "react";
import type { Metadata } from "next";
import SignupPage from "@/features/auth/pages/SignupPage";

export const metadata: Metadata = {
  title: "Create Account | Eventvnv",
  description: "Create your Eventvnv account.",
};

export default function SignupRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <SignupPage />
    </Suspense>
  );
}

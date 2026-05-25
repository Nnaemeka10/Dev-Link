import { Suspense } from "react";
import type { Metadata } from "next";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password | Eventvnv",
  description: "Reset your Eventvnv password.",
};

export default function ForgotPasswordRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <ForgotPasswordPage />
    </Suspense>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password | Eventvnv",
  description: "Reset your Eventvnv password.",
};

export default function ResetPasswordRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <ResetPasswordPage />
    </Suspense>
  );
}

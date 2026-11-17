import type { Metadata } from "next";
import AuthGuard from "@/features/auth/AuthGuard";
import VendorTransactionsPage from "@/features/vendor/pages/VendorTransactionsPage";

export const metadata: Metadata = {
  title: "Transactions | Eventvnv Host",
  description: "Every completed payout to your bank account on EventVnV.",
};

export default function VendorTransactionsRoute() {
  return (
    <AuthGuard>
      <VendorTransactionsPage />
    </AuthGuard>
  );
}
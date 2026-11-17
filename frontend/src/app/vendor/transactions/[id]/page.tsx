import type { Metadata } from "next";
import AuthGuard from "@/features/auth/AuthGuard";
import VendorTransactionDetailPage from "@/features/vendor/pages/VendorTransactionDetailPage";

export const metadata: Metadata = {
  title: "Payout details | Eventvnv Host",
  description: "Full breakdown, transfer references and receipt for a vendor payout.",
};

export default function VendorTransactionDetailRoute() {
  return (
    <AuthGuard>
      <VendorTransactionDetailPage />
    </AuthGuard>
  );
}
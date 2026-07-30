"use client";

import { usePayoutMethodStatus } from "../../profile/hooks/usePayoutVerification";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerificationStatusBanner() {
  const { data: status, isLoading } = usePayoutMethodStatus();
  const router = useRouter();

  if (isLoading) return null;

  // 1. Unregistered or Manual Review: Block payouts, prompt action
  if (status?.status === "unregistered" || status?.status === "manual_review" || status?.status === "failed") {
    return (
      <div className="animate-fade-up rounded-2xl bg-red-50 p-5 text-red-600 border border-red-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 shrink-0 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Payouts Paused: Verification Required</p>
            <p className="text-xs text-red-500/80 mt-0.5">
              {status?.status === "manual_review" 
                ? "We need to manually confirm your account details." 
                : "Please add a payout method in your profile to receive escrow payouts."}
            </p>
          </div>
          <button 
            onClick={() => router.push("/profile")}
            className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-colors shrink-0"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  // 2. Pending: Show animated waiting state
  if (status?.status === "pending") {
    return (
      <div className="animate-fade-up rounded-2xl bg-amber-50 p-5 text-amber-700 border border-amber-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <p className="font-bold text-sm">Verification in Progress</p>
            <p className="text-xs text-amber-600/80 mt-0.5">Your bank and identity are being verified. This usually completes within 5 minutes.</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Verified: Show success payout notice
  if (status?.status === "verified") {
    return (
      <div className="animate-fade-up rounded-2xl bg-[#D65C3A]/10 p-5 text-[#D65C3A] border border-[#D65C3A]/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 shrink-0 rounded-full bg-[#D65C3A]/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Account Verified</p>
            <p className="text-xs text-[#D65C3A]/80 mt-0.5">Funds will be automatically disbursed to your bank account after the booked dates have elapsed.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
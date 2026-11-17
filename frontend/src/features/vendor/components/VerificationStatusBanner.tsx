"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { usePayoutMethodStatus } from "../../profile/hooks/usePayoutVerification";
import { EASE_OUT } from "../utils";

type Tone = "danger" | "warning" | "success";

const TONES: Record<Tone, { wrap: string; chip: string; title: string; body: string; cta: string }> = {
  danger: {
    wrap: "border-red-100 bg-white",
    chip: "bg-red-100 text-red-600",
    title: "text-red-700",
    body: "text-[#6B5F57]",
    cta: "bg-red-600 text-white hover:bg-red-700",
  },
  warning: {
    wrap: "border-amber-100 bg-white",
    chip: "bg-amber-100 text-amber-700",
    title: "text-amber-700",
    body: "text-[#6B5F57]",
    cta: "bg-[#F7F2EA] text-[#252423] hover:brightness-95",
  },
  success: {
    wrap: "border-emerald-100 bg-white",
    chip: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-700",
    body: "text-[#6B5F57]",
    cta: "bg-[#F7F2EA] text-[#252423] hover:brightness-95",
  },
};

export default function VerificationStatusBanner() {
  const router = useRouter();
  const { data: status, isLoading } = usePayoutMethodStatus();

  if (isLoading || !status) return null;

  let tone: Tone;
  let title: string;
  let body: string;
  let ctaLabel: string | null = null;
  let Icon: React.ElementType;
  let spinning = false;

  switch (status.status) {
    case "verified":
      tone = "success";
      Icon = ShieldCheck;
      title = "Payouts active";
      body =
        "Funds are released automatically after each event and its 24-hour dispute window.";
      break;
    case "pending":
      tone = "warning";
      Icon = Loader2;
      spinning = true;
      title = "Verification in progress";
      body = "Your bank and identity are being checked. This usually clears within 5 minutes.";
      break;
    case "manual_review":
      tone = "danger";
      Icon = AlertCircle;
      title = "Payouts paused — account under review";
      body = "We need to manually confirm your account details before payouts can resume.";
      ctaLabel = "Review account";
      break;
    case "failed":
      tone = "danger";
      Icon = AlertCircle;
      title = "Payouts paused — verification failed";
      body = "Double-check your account number and BVN, then submit them again.";
      ctaLabel = "Fix details";
      break;
    default:
      tone = "danger";
      Icon = AlertCircle;
      title = "Payouts paused — no payout account";
      body = "Add a verified bank account so client payments can reach you.";
      ctaLabel = "Add payout method";
      break;
  }

  const t = TONES[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={`flex flex-col gap-3 rounded-[1.75rem] border p-4 shadow-[0_10px_30px_rgba(36,28,18,0.05)] sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${t.wrap}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.chip}`}>
        <Icon className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-extrabold ${t.title}`}>{title}</p>
        <p className={`mt-0.5 text-tiny font-semibold leading-5 ${t.body}`}>{body}</p>
      </div>

      {ctaLabel && (
        <button
          type="button"
          onClick={() => router.push("/vendor/profile")}
          className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-extrabold transition-all active:scale-95 ${t.cta}`}
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}
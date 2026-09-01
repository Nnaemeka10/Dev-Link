"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Clock3, ShieldAlert } from "lucide-react";
import Modal from "./shared/Modal";

type PayoutStatus = "unregistered" | "pending" | "verified" | "failed" | "manual_review";

const MY_LISTINGS_PATH = "/vendor/mylistings"; 
const PROFILE_PATH = "/profile";

const STATUS_META: Record<
  Exclude<PayoutStatus, "verified">,
  { title: string; body: string; Icon: typeof AlertCircle; iconWrap: string }
> = {
  unregistered: {
    title: "Add your payout account",
    body: "To publish this listing, we first need your bank details so client payments can reach you. Add a payout method in your profile - it only takes a few minutes, and your draft will be waiting right here.",
    Icon: AlertCircle,
    iconWrap: "bg-red-100 text-red-600",
  },
  pending: {
    title: "Verification in progress",
    body: "Your bank account is being verified and usually clears within 5 minutes. Save this listing as a draft and publish as soon as you're verified.",
    Icon: Clock3,
    iconWrap: "bg-amber-100 text-amber-600",
  },
  failed: {
    title: "Verification failed",
    body: "We couldn't verify your bank account. Please double-check your account number and BVN in your profile, then submit them again.",
    Icon: AlertCircle,
    iconWrap: "bg-red-100 text-red-600",
  },
  manual_review: {
    title: "Account under review",
    body: "We need to manually confirm your account details, which can take a little longer. Save this listing as a draft — you can publish the moment we confirm everything.",
    Icon: ShieldAlert,
    iconWrap: "bg-amber-100 text-amber-600",
  },
};

const FALLBACK_META = {
  title: "Bank verification required",
  body: "Your payout account needs to be verified before this listing can go live. Review your verification in your profile, then come back and publish.",
  Icon: ShieldAlert,
  iconWrap: "bg-amber-100 text-amber-600",
};

interface VerificationRequiredModalProps {
  isOpen: boolean;
  status: PayoutStatus | undefined;
  /** Your existing save-draft logic — called before navigating away. */
  onSaveDraft: () => Promise<void> | void;
  onClose: () => void;
}

export default function VerificationRequiredModal({
  isOpen,
  status,
  onSaveDraft,
  onClose,
}: VerificationRequiredModalProps) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);

  const meta = status && status !== "verified" && STATUS_META[status] ? STATUS_META[status] : FALLBACK_META;
  const { Icon } = meta;

  const handleReviewAccount = async () => {
    setIsWorking(true);
    try {
      await onSaveDraft();
    } catch {
      // The debounced autosave already has the latest state — don't block the user.
    }
    router.push(PROFILE_PATH);
  };

  const handleSaveDraft = async () => {
    setIsWorking(true);
    try {
      await onSaveDraft();
      router.push(MY_LISTINGS_PATH);
    } catch {
      setIsWorking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isWorking ? () => {} : onClose}
      title={meta.title}
      description="You can't publish yet, but your listing is safe."
      maxWidthClassName="max-w-md"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4 rounded-card bg-bg-tertiary p-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </span>
          <p className="pt-1 text-sm leading-relaxed text-text-primary/70">{meta.body}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleReviewAccount}
            disabled={isWorking}
            className="flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-3.5 text-sm font-bold text-white shadow-card transition-all hover:scale-[1.02] hover:shadow-card-hover active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            Review Account Verification
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isWorking}
            className="rounded-full bg-bg-tertiary px-6 py-3.5 text-sm font-bold text-text-primary transition-all hover:bg-black/[0.06] active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            Save as Draft & Publish Later
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="mx-auto rounded-full px-4 py-1.5 text-sm font-semibold text-text-primary/50 transition-colors hover:text-text-primary"
          >
            Keep editing
          </button>
        </div>
      </div>
    </Modal>
  );
}
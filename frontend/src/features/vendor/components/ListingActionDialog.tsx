"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarClock,
  EyeOff,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import HubModal from "@/features/saved/components/HubModal";
import { ApiError } from "@/lib/api";
import {
  deleteListingDraft,
  relistListing,
  unlistListing,
} from "../../createListing/api/listingDraft.api";
import type { VendorListing } from "../types";
import { EASE_OUT } from "../utils";

export type ListingActionKind = "delete" | "unlist" | "relist";

const COPY: Record<
  ListingActionKind,
  {
    title: string;
    subtitle: string;
    body: string;
    confirm: string;
    pending: string;
    icon: React.ElementType;
    iconWrap: string;
    confirmClass: string;
  }
> = {
  delete: {
    title: "Delete this listing?",
    subtitle: "Removed from EventVnV",
    body: "It disappears from search and from your listings. Past bookings, reviews and payout records are kept intact for your history. This can't be undone.",
    confirm: "Delete listing",
    pending: "Deleting…",
    icon: Trash2,
    iconWrap: "bg-red-100 text-red-600",
    confirmClass: "bg-red-600 hover:bg-red-700",
  },
  unlist: {
    title: "Unlist this listing?",
    subtitle: "Hidden from search",
    body: "It stops appearing in search and can't take new bookings. Every existing booking is honoured and paid as normal, and you can relist it whenever you're ready.",
    confirm: "Unlist listing",
    pending: "Unlisting…",
    icon: EyeOff,
    iconWrap: "bg-[#F4F1EA] text-[#6B5F57]",
    confirmClass: "bg-[#252423] hover:brightness-110",
  },
  relist: {
    title: "Relist this listing?",
    subtitle: "Back in search",
    body: "It returns to search and can accept new bookings again. Any changes you saved while it was unlisted go live with it.",
    confirm: "Relist listing",
    pending: "Relisting…",
    icon: RotateCcw,
    iconWrap: "bg-emerald-100 text-emerald-700",
    confirmClass: "bg-[#B9401D] hover:brightness-95",
  },
};

interface ListingActionDialogProps {
  /** null = closed. */
  action: ListingActionKind | null;
  listing: VendorListing | null;
  onClose: () => void;
  onSuccess: (action: ListingActionKind, listing: VendorListing) => void;
}

/**
 * The three lifecycle transitions share one dialog so the consequences are
 * always spelled out before anything irreversible happens.
 *
 * Delete is server-guarded: while the listing still owes someone an event the
 * API answers 409 ACTIVE_BOOKINGS, and this dialog turns that refusal into the
 * safe alternative (Unlist) instead of a dead-end error.
 */
export default function ListingActionDialog({
  action,
  listing,
  onClose,
  onSuccess,
}: ListingActionDialogProps) {
  const router = useRouter();
  const [override, setOverride] = useState<ListingActionKind | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteListingDraft(id),
  });
  const unlistMutation = useMutation({
    mutationFn: (id: string) => unlistListing(id),
  });
  const relistMutation = useMutation({
    mutationFn: (id: string) => relistListing(id),
  });

  useEffect(() => {
    if (!action) return;
    setOverride(null);
    setBlockedMessage(null);
    setNeedsVerification(false);
    setError(null);
  }, [action, listing?.id]);

  const active = override ?? action;
  const isPending =
    deleteMutation.isPending || unlistMutation.isPending || relistMutation.isPending;

  async function handleConfirm() {
    if (!listing || !active) return;
    setError(null);
    try {
      if (active === "delete") await deleteMutation.mutateAsync(listing.id);
      else if (active === "unlist") await unlistMutation.mutateAsync(listing.id);
      else await relistMutation.mutateAsync(listing.id);
      onSuccess(active, listing);
      onClose();
    } catch (err) {
      if (
        active === "delete" &&
        err instanceof ApiError &&
        err.status === 409 &&
        err.data?.code === "ACTIVE_BOOKINGS"
      ) {
        setBlockedMessage(err.message);
        return;
      }
      if (err instanceof ApiError && err.data?.code === "VERIFICATION_REQUIRED") {
        setNeedsVerification(true);
        setError(err.message);
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }

  if (!listing || !active) {
    return (
      <HubModal isOpen={false} title="" onClose={onClose}>
        <span />
      </HubModal>
    );
  }

  const copy = COPY[active];
  const Icon = blockedMessage ? CalendarClock : needsVerification ? ShieldAlert : copy.icon;
  const iconWrap = blockedMessage
    ? "bg-amber-100 text-amber-700"
    : needsVerification
      ? "bg-red-100 text-red-600"
      : copy.iconWrap;

  const title = blockedMessage
    ? "This listing still has bookings"
    : needsVerification
      ? "Verification required"
      : copy.title;

  return (
    <HubModal
      isOpen={!!action}
      title={title}
      subtitle={listing.title}
      onClose={isPending ? () => {} : onClose}
      maxWidth="max-w-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="space-y-5"
      >
        <div className="flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3.5">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrap}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="pt-1 text-sm font-semibold leading-6 text-[#6B5F57]">
            {blockedMessage ? (
              <>
                {listing.upcomingBookings > 0 && (
                  <strong className="text-[#252423]">
                    {listing.upcomingBookings} upcoming booking
                    {listing.upcomingBookings === 1 ? "" : "s"}{" "}
                  </strong>
                )}
                {blockedMessage ||
                  "This listing still has upcoming bookings. Unlist it instead - it disappears from search, your existing bookings are honoured, and you can relist it any time."}
              </>
            ) : needsVerification ? (
              error
            ) : (
              copy.body
            )}
          </p>
        </div>

        {!blockedMessage && !needsVerification && listing.upcomingBookings > 0 && (
          <p className="flex items-center gap-2 rounded-2xl border border-[#F0E9DF] bg-white px-4 py-3 text-tiny font-bold text-[#6B5F57]">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
            {listing.upcomingBookings} upcoming booking
            {listing.upcomingBookings === 1 ? "" : "s"} on this listing
          </p>
        )}

        {error && !needsVerification && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {blockedMessage ? (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setBlockedMessage(null);
                setError(null);
                setOverride("unlist");
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B9401D] py-3.5 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.99]"
            >
              <EyeOff className="h-4 w-4" aria-hidden="true" />
              Unlist instead
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full py-2.5 text-sm font-bold text-[#9A9AAE] transition-colors hover:text-[#252423]"
            >
              Keep listing live
            </button>
          </div>
        ) : needsVerification ? (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/vendor/profile")}
              className="w-full rounded-full bg-[#B9401D] py-3.5 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.99]"
            >
              Review account verification
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full py-2.5 text-sm font-bold text-[#9A9AAE] transition-colors hover:text-[#252423]"
            >
              Not now
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 rounded-full border border-[#E8DDD2] py-3.5 text-sm font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-extrabold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${copy.confirmClass}`}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {copy.pending}
                </>
              ) : (
                copy.confirm
              )}
            </button>
          </div>
        )}
      </motion.div>
    </HubModal>
  );
}
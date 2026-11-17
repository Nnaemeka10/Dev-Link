"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, CheckCircle2, Loader2, Undo2 } from "lucide-react";
import HubModal from "@/features/saved/components/HubModal";
import { ApiError } from "@/lib/api";
import { useDeclineBooking } from "../hooks/useVendorDashboard";
import { DECLINE_REASONS, type DeclineReasonKey } from "../types";
import { EASE_OUT, naira } from "../utils";

const MAX_NOTE = 500;

export interface DeclineTarget {
  id: string;
  bookingRef: string;
  clientName: string;
  /** Gross amount the customer paid - what gets refunded in full. */
  refundAmount: number;
}

interface DeclineBookingModalProps {
  isOpen: boolean;
  booking: DeclineTarget | null;
  onClose: () => void;
  onDeclined?: () => void;
}

/**
 * Declining is a money movement, not a status flip: it runs the existing
 * vendor_decline refund path (full Paystack refund + escrow reversal +
 * calendar release) and emails both parties. The copy says so plainly so
 * the vendor can never decline by accident thinking it's a soft rejection.
 */
export default function DeclineBookingModal({
  isOpen,
  booking,
  onClose,
  onDeclined,
}: DeclineBookingModalProps) {
  const [reason, setReason] = useState<DeclineReasonKey>("dates_unavailable");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useDeclineBooking();

  useEffect(() => {
    if (!isOpen) return;
    setReason("dates_unavailable");
    setNote("");
    setDone(false);
    setError(null);
  }, [isOpen, booking?.id]);

  if (!booking) return null;

  const needsNote = reason === "other";
  const canSubmit = !needsNote || note.trim().length >= 10;

  async function handleSubmit() {
    if (!booking || !canSubmit) return;
    setError(null);
    try {
      await mutation.mutateAsync({
        bookingId: booking.id,
        reason,
        note: note.trim() || undefined,
      });
      setDone(true);
      onDeclined?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't process the refund. Please try again."
      );
    }
  }

  return (
    <HubModal
      isOpen={isOpen}
      title={done ? "Booking declined" : "Decline this booking?"}
      subtitle={booking.bookingRef}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {done ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.32, ease: EASE_OUT }}
          className="flex flex-col items-center py-6 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-base font-extrabold text-[#252423]">
            Refund on its way
          </h3>
          <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-[#9A9AAE]">
            {booking.clientName} has been refunded{" "}
            <strong className="text-[#252423]">{naira(booking.refundAmount)}</strong> in
            full and emailed. Those dates are open for booking again, and no payout
            will be made for this booking.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full bg-[#B9401D] px-7 py-2.5 text-xs font-extrabold text-white transition-all hover:brightness-95 active:scale-95"
          >
            Done
          </button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl bg-[#FDF1EC] px-4 py-3.5">
            <Undo2 className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            <p className="text-tiny font-semibold leading-5 text-[#8A3A1C] md:text-xs">
              Declining refunds {booking.clientName}{" "}
              <strong>{naira(booking.refundAmount)}</strong> in full, immediately. This
              can&apos;t be undone — the customer will need to book again.
            </p>
          </div>

          <fieldset>
            <legend className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
              Reason
            </legend>
            <div className="mt-2.5 space-y-2">
              {DECLINE_REASONS.map((option, index) => {
                const active = reason === option.key;
                return (
                  <motion.button
                    key={option.key}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: index * 0.04,
                      ease: EASE_OUT,
                    }}
                    onClick={() => setReason(option.key)}
                    aria-pressed={active}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
                      active
                        ? "border-[#B9401D] bg-[#FFF7F2]"
                        : "border-[#E8DDD2] bg-white hover:border-[#B9401D]/40"
                    }`}
                  >
                    <span className="text-sm font-bold text-[#252423]">
                      {option.label}
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        active
                          ? "border-[#B9401D] bg-[#B9401D]"
                          : "border-[#D8CDBF] bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="decline-note"
              className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]"
            >
              {needsNote ? "Explanation (required)" : "Note to support (optional)"}
            </label>
            <textarea
              id="decline-note"
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, MAX_NOTE))}
              rows={3}
              placeholder={
                needsNote
                  ? "Tell us what happened (at least 10 characters)…"
                  : "Anything support should know…"
              }
              className="mt-2 w-full resize-none rounded-2xl border border-[#E8DDD2] bg-white px-4 py-3 text-sm font-semibold text-[#252423] outline-none transition-shadow placeholder:text-[#C4BBAE] focus:border-[#B9401D]/40 focus:ring-2 focus:ring-[#B9401D]/15"
            />
            <p className="mt-1 text-right text-micro font-bold text-[#C4BBAE]">
              {note.length}/{MAX_NOTE}
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 rounded-full border border-[#E8DDD2] py-3.5 text-sm font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] disabled:opacity-50"
            >
              Keep booking
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || mutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3.5 text-sm font-extrabold text-white transition-all hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Refunding…
                </>
              ) : (
                "Decline & refund"
              )}
            </button>
          </div>
        </div>
      )}
    </HubModal>
  );
}
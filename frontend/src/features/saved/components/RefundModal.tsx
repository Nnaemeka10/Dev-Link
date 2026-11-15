"use client";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import HubModal from "./HubModal";
import { useRequestRefund } from "../hooks/useSavedHub";
import { REFUND_REASONS, type MyBookingItem, type RefundReason } from "../saved.types";
import { ApiError } from "@/lib/api";

export default function RefundModal({
  isOpen,
  booking,
  onClose,
}: {
  isOpen: boolean;
  booking: MyBookingItem;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<RefundReason>("vendor_unresponsive");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useRequestRefund(booking.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ reason, description });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit refund request.");
    }
  }

  return (
    <HubModal isOpen={isOpen} title="Request a refund" subtitle={booking.bookingReference} onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-extrabold text-[#252423]">Request submitted</h3>
          <p className="mt-2 max-w-sm text-sm font-semibold text-[#9A9AAE]">
            Our support team will review your request and email you once a decision is made. Approved refunds return to your original payment method.
          </p>
          <button type="button" onClick={onClose} className="mt-6 rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl bg-[#F7F2EA] px-4 py-3 text-sm font-semibold text-[#6B5F57]">
            Full refund of <strong className="text-[#252423]">₦{booking.totalAmount.toLocaleString("en-NG")}</strong> for {booking.listingTitle}.
            Refunds are reviewed by support before being processed.
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RefundReason)}
              className="mt-1.5 w-full rounded-2xl border border-[#E8DDD2] bg-white px-4 py-3 text-sm font-bold text-[#252423] focus:border-[#B9401D] focus:outline-none"
            >
              {REFUND_REASONS.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Tell us more</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe why you're requesting a refund (at least 10 characters)…"
              className="mt-1.5 w-full resize-none rounded-2xl border border-[#E8DDD2] bg-white px-4 py-3 text-sm font-semibold text-[#252423] placeholder:text-[#C4BBAE] focus:border-[#B9401D] focus:outline-none"
            />
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={mutation.isPending || description.trim().length < 10}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B9401D] py-3.5 text-sm font-extrabold text-white transition hover:brightness-95 disabled:opacity-50"
          >
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit refund request"}
          </button>
        </form>
      )}
    </HubModal>
  );
}
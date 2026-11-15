"use client";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import HubModal from "./HubModal";
import { useSubmitComplaint } from "../hooks/useSavedHub";
import { COMPLAINT_CATEGORIES, type ComplaintCategory, type MyBookingItem } from "../saved.types";
import { ApiError } from "@/lib/api";

export default function ComplaintModal({
  isOpen,
  booking,
  onClose,
}: {
  isOpen: boolean;
  booking: MyBookingItem;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<ComplaintCategory>("service_quality");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useSubmitComplaint(booking.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ category, subject, message });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit complaint.");
    }
  }

  return (
    <HubModal isOpen={isOpen} title="Report an issue" subtitle={booking.bookingReference} onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-extrabold text-[#252423]">Complaint received</h3>
          <p className="mt-2 max-w-sm text-sm font-semibold text-[#9A9AAE]">
            Our support team has been notified at support@eventvnv.com and will reach out shortly.
          </p>
          <button type="button" onClick={onClose} className="mt-6 rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white">Done</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              className="mt-1.5 w-full rounded-2xl border border-[#E8DDD2] bg-white px-4 py-3 text-sm font-bold text-[#252423] focus:border-[#B9401D] focus:outline-none"
            >
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Subject (optional)</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary"
              className="mt-1.5 w-full rounded-2xl border border-[#E8DDD2] bg-white px-4 py-3 text-sm font-semibold text-[#252423] placeholder:text-[#C4BBAE] focus:border-[#B9401D] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">What happened?</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Describe the issue in detail (at least 10 characters)…"
              className="mt-1.5 w-full resize-none rounded-2xl border border-[#E8DDD2] bg-white px-4 py-3 text-sm font-semibold text-[#252423] placeholder:text-[#C4BBAE] focus:border-[#B9401D] focus:outline-none"
            />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={mutation.isPending || message.trim().length < 10}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B9401D] py-3.5 text-sm font-extrabold text-white transition hover:brightness-95 disabled:opacity-50"
          >
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send to support"}
          </button>
        </form>
      )}
    </HubModal>
  );
}
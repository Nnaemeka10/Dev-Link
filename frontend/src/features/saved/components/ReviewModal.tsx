"use client";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import HubModal from "./HubModal";
import { useMyReview, useSubmitReview } from "../hooks/useSavedHub";
import { reviewDimensionsFor, type MyBookingItem } from "../saved.types";
import { ApiError } from "@/lib/api";

function StarPicker({ value, onChange, size = "h-7 w-7" }: { value: number; onChange: (v: number) => void; size?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} star${i > 1 ? "s" : ""}`}>
          <Star className={`${size} transition-colors ${i <= (hover || value) ? "fill-[#B9401D] text-[#B9401D]" : "text-[#D8CDBF]"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewModal({
  isOpen,
  booking,
  onClose,
}: {
  isOpen: boolean;
  booking: MyBookingItem;
  onClose: () => void;
}) {
  const dims = useMemo(() => reviewDimensionsFor(booking.kind), [booking.kind]);
  const { data: existing } = useMyReview(isOpen ? booking.id : null);
  const mutation = useSubmitReview(booking.id);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [subs, setSubs] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const review = existing?.review;
    setRating(review?.rating ?? 0);
    setBody(review?.body ?? "");
    setSubs(review?.subRatings ?? {});
    setDone(false);
    setError(null);
  }, [isOpen, existing]);

  const valid = rating >= 1 && body.trim().length >= 10 && dims.every((d) => (subs[d.key] ?? 0) >= 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ rating, body, subRatings: subs });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save review.");
    }
  }

  return (
    <HubModal
      isOpen={isOpen}
      title={booking.hasReview ? "Edit your review" : "Rate & review"}
      subtitle={booking.listingTitle}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      {done ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-extrabold text-[#252423]">Review saved</h3>
          <p className="mt-2 max-w-sm text-sm font-semibold text-[#9A9AAE]">Thanks — your feedback helps other customers book with confidence.</p>
          <button type="button" onClick={onClose} className="mt-6 rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white">Done</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center rounded-2xl bg-[#F7F2EA] py-5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Overall rating</p>
            <div className="mt-2"><StarPicker value={rating} onChange={setRating} size="h-9 w-9" /></div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Rate each category</p>
            {dims.map((d) => (
              <div key={d.key} className="flex items-center justify-between gap-4 rounded-2xl border border-[#F0E9DF] px-4 py-3">
                <span className="text-sm font-bold text-[#252423]">{d.label}</span>
                <StarPicker value={subs[d.key] ?? 0} onChange={(v) => setSubs((s) => ({ ...s, [d.key]: v }))} size="h-5 w-5" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Your review</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Share your experience (at least 10 characters)…"
              className="mt-1.5 w-full resize-none rounded-2xl border border-[#E8DDD2] bg-white px-4 py-3 text-sm font-semibold text-[#252423] placeholder:text-[#C4BBAE] focus:border-[#B9401D] focus:outline-none"
            />
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={!valid || mutation.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B9401D] py-3.5 text-sm font-extrabold text-white transition hover:brightness-95 disabled:opacity-50"
          >
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : booking.hasReview ? "Update review" : "Publish review"}
          </button>
        </form>
      )}
    </HubModal>
  );
}
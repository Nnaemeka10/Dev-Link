"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, MessageSquare } from "lucide-react";
import { DateRangePicker } from "@/features/search/components/DateRange";
import type { DateRange } from "@/features/search/utils/searchSchema";
import { createConversation } from "@/features/chat/chat.api";
import { usePricingQuote } from "@/features/bookings/hooks/usePricingQuote";
import {
  countSelectedDays,
  envelope,
  excludedDates,
  finalizeRanges,
} from "@/features/search/utils/rangeSelection";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface BookingCardProps {
  booked: boolean;
  /** Multi-range selection - identical shape to the booking wizard. */
  dateRanges: DateRange[];
  onDateRangesChange: (ranges: DateRange[]) => void;
  onBook: () => void;
  price: string;
  priceRaw: number;
  listingId: string;
  unavailableDates?: { from: string; to: string }[];
  variant?: "desktop" | "mobile";
}

function fmt(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function BookingCard({
  booked,
  dateRanges,
  onDateRangesChange,
  onBook,
  price,
  priceRaw,
  listingId,
  unavailableDates = [],
  variant = "desktop",
}: BookingCardProps) {
  const compact = variant === "mobile";
  const router = useRouter();

  const range = envelope(dateRanges);
  const holes = useMemo(() => excludedDates(dateRanges), [dateRanges]);
  const hasDates = finalizeRanges(dateRanges).length > 0;
  const dayCount = countSelectedDays(dateRanges);

  const { data: quote, isLoading } = usePricingQuote(
    listingId,
    range,
    undefined,
    holes
  );

  const handleChatWithVendor = async () => {
    try {
      const res = await createConversation({ listingId });
      router.push(`/messages?conversationId=${res.id}`);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  return (
    <aside
      className={`h-fit rounded-4xl bg-white shadow-[0_24px_54px_rgba(34,27,18,0.1)] ${
        compact ? "p-6" : "sticky top-8 p-8"
      }`}
    >
      <div className="flex items-end justify-between">
        <p className="text-3xl font-extrabold text-[#252423]">
          {price}
          <span className="text-sm font-bold text-[#5E6588]">/day</span>
        </p>
      </div>

      {/* Dates + live cost. The old "Time" selector lived here - it never fed
          the booking (the wizard collects real 24-hour start/end times), so
          it is replaced by the price the customer will actually pay. */}
      <div className="mt-7 overflow-hidden rounded-[1.35rem] border border-[#E8DDD2]">
        <div className="border-b border-[#E8DDD2] bg-white">
          <DateRangePicker
            multi
            ranges={dateRanges}
            onRangesChange={onDateRangesChange}
            // Single-range contract is unused in multi mode.
            value={undefined}
            onChange={() => {}}
            issearch={false}
            listingId={listingId}
            unavailableDates={unavailableDates}
          />
        </div>

        <div className="bg-[#FAF8F5] px-5 py-4">
          {!hasDates ? (
            <div className="flex items-start gap-2.5">
              <CalendarDays
                className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-extrabold text-[#252423]">
                  Select dates to see your total
                </p>
                <p className="mt-0.5 text-[11px] font-semibold leading-5 text-[#7B7E9B]">
                  {fmt(priceRaw)} per day × the days you keep, plus 7.5% VAT.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="animate-pulse space-y-2.5">
              <div className="h-3.5 w-3/4 rounded bg-[#E8E1D7]" />
              <div className="h-3.5 w-1/2 rounded bg-[#E8E1D7]" />
              <div className="h-6 w-2/3 rounded bg-[#E8E1D7]" />
            </div>
          ) : quote ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="font-semibold text-[#5E6588]">
                  {fmt(priceRaw)} × {quote.days} {quote.days === 1 ? "day" : "days"}
                </span>
                <strong className="shrink-0 text-[#252423]">
                  {fmt(quote.subtotal)}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-[#5E6588]">VAT (7.5%)</span>
                <strong className="text-[#252423]">{fmt(quote.vat)}</strong>
              </div>
              {holes.length > 0 && (
                <p className="text-[11px] font-bold text-[#2D5A27]">
                  {holes.length} removed {holes.length === 1 ? "day" : "days"} not charged
                </p>
              )}
              <div className="flex items-end justify-between gap-3 border-t border-[#E8DDD2] pt-2.5">
                <span className="text-sm font-extrabold text-[#252423]">Total</span>
                <motion.strong
                  key={quote.total}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="text-xl font-extrabold text-[#B9401D]"
                >
                  {fmt(quote.total)}
                </motion.strong>
              </div>
            </motion.div>
          ) : (
            <p className="text-sm font-semibold text-[#9A9AAE]">
              We couldn&apos;t price these dates. Try selecting them again.
            </p>
          )}
        </div>
      </div>

      {hasDates && (
        <p className="mt-3 text-center text-[11px] font-bold text-[#B9401D]">
          {dayCount} {dayCount === 1 ? "day" : "days"} selected · tap a selected day to
          remove it
        </p>
      )}

      <button
        type="button"
        onClick={onBook}
        className="mt-5 w-full rounded-full bg-[#B9401D] px-6 py-4 text-sm font-extrabold text-white shadow-[0_14px_26px_rgba(185,64,29,0.18)] transition-all hover:brightness-95 active:scale-[0.99]"
      >
        {booked ? "Booked" : "Book"}
      </button>

      <button
        type="button"
        onClick={handleChatWithVendor}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-sm font-extrabold text-[#252423] transition-all hover:brightness-95 active:scale-[0.99]"
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        Chat with Vendor
      </button>

      <p className="mt-5 text-center text-[11px] font-semibold text-[#7B7E9B]">
        You won&apos;t be charged yet
      </p>
    </aside>
  );
}
"use client";

import {
  CalendarDays, CalendarClock, Clock, CreditCard, MapPin, User, Hash, Receipt, Star,
  Undo2, Flag, MessageCircle, RotateCcw, UsersRound,
} from "lucide-react";
import HubModal from "./HubModal";
import StatusPill from "./StatusPill";
import { useHubBookingDetails } from "../hooks/useSavedHub";
import type { BookingActionType } from "./BookingCard";
import {
  allSpansLabel,
  bookedSpans,
  countBookedDays,
  formatDay,
  formatEventTimeLabel,
  formatWatDateTimeLabelled,
} from "@/lib/datetime";

function naira(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" />
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">{label}</p>
        <p className="mt-0.5 text-sm font-bold leading-snug text-[#252423]">{value}</p>
      </div>
    </div>
  );
}

export default function BookingDetailsModal({
  isOpen,
  bookingId,
  onClose,
  onAction,
}: {
  isOpen: boolean;
  bookingId: string;
  onClose: () => void;
  onAction: (type: BookingActionType) => void;
}) {
  const { data, isLoading } = useHubBookingDetails(isOpen ? bookingId : null);

  const spans = data ? bookedSpans(data.startDate, data.endDate, data.excludedDates) : [];
  const dayCount = countBookedDays(spans);

  return (
    <HubModal isOpen={isOpen} title="Booking details" subtitle={data?.bookingReference} onClose={onClose} maxWidth="max-w-xl">
      {isLoading || !data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#F7F2EA]" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-extrabold text-[#252423]">{data.listingTitle}</h3>
              <p className="text-xs font-semibold text-[#9A9AAE]">
                {data.kind === "hall" ? "Hall" : "Service"} · {data.vendorName}
              </p>
            </div>
            <StatusPill status={data.status} />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Row
              icon={CalendarDays}
              label={`Event dates · ${dayCount} ${dayCount === 1 ? "day" : "days"}`}
              value={allSpansLabel(spans)}
            />
            <Row icon={Clock} label="Event time" value={formatEventTimeLabel(data.startTime, data.endTime)} />
            <Row
              icon={MapPin}
              label={data.kind === "hall" ? "Venue location" : "Event location"}
              value={data.location || "Location to be added"}
            />
            <Row icon={User} label="Vendor" value={data.vendorName} />
            {data.kind === "hall" && (
              <Row icon={UsersRound} label="Guests" value={`${(data.guests ?? 1).toLocaleString()} expected`} />
            )}
            {data.packageName && <Row icon={Hash} label="Package" value={data.packageName} />}

            {/* When the booking was made / settled - pinned to WAT so the
                customer and the vendor always read the same clock. */}
            <Row icon={CalendarClock} label="Booked on" value={formatWatDateTimeLabelled(data.createdAt)} />
            {data.paidAt && (
              <Row icon={CreditCard} label="Paid on" value={formatWatDateTimeLabelled(data.paidAt)} />
            )}
            <Row icon={Hash} label="Reference" value={data.bookingReference} />
          </div>

          {data.excludedDates.length > 0 && (
            <div className="rounded-2xl bg-[#F7F2EA] px-4 py-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Removed days (not charged)</p>
              <p className="mt-1 text-sm font-bold text-[#252423]">
                {data.excludedDates.map((d) => formatDay(d)).join(", ")}
              </p>
            </div>
          )}

          {/* Price breakdown */}
          <div className="rounded-2xl border border-[#F0E9DF] p-4">
            <div className="flex justify-between text-sm font-semibold text-[#5E6588]">
              <span>Subtotal</span><span>{naira(data.subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm font-semibold text-[#5E6588]">
              <span>VAT (7.5%)</span><span>{naira(data.vat)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-[#F0E9DF] pt-3 text-base font-extrabold text-[#252423]">
              <span>Total paid</span><span>{naira(data.totalAmount)}</span>
            </div>
          </div>

          {data.cancellationReason && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Cancelled: {data.cancellationReason.replace(/_/g, " ")}
              {data.cancelledAt ? ` · ${formatWatDateTimeLabelled(data.cancelledAt)}` : ""}
            </div>
          )}

          {data.refund && (
            <div className="rounded-2xl bg-[#F7F2EA] px-4 py-3 text-sm font-semibold text-[#6B5F57]">
              Refund {data.refund.status}
              {data.refund.status === "pending" && " - support is reviewing your request."}
            </div>
          )}

          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[#C4BBAE]">
            All times shown in West Africa Time (WAT · Lagos)
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {data.actions.canChat && (
              <button type="button" onClick={() => onAction("chat")} className="inline-flex items-center gap-1.5 rounded-full bg-[#B9401D] px-4 py-2 text-xs font-extrabold text-white transition hover:brightness-95">
                <MessageCircle className="h-3.5 w-3.5" /> Chat vendor
              </button>
            )}
            {data.actions.canRequestRefund && (
              <button type="button" onClick={() => onAction("refund")} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DDD2] px-4 py-2 text-xs font-extrabold text-[#252423] transition hover:bg-[#F7F2EA]">
                <Undo2 className="h-3.5 w-3.5" /> Request refund
              </button>
            )}
            {data.actions.canReview && (
              <button type="button" onClick={() => onAction("review")} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DDD2] px-4 py-2 text-xs font-extrabold text-[#252423] transition hover:bg-[#F7F2EA]">
                <Star className="h-3.5 w-3.5" /> {data.hasReview ? "Edit review" : "Rate & review"}
              </button>
            )}
            {data.actions.canComplaint && (
              <button type="button" onClick={() => onAction("complaint")} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DDD2] px-4 py-2 text-xs font-extrabold text-[#252423] transition hover:bg-[#F7F2EA]">
                <Flag className="h-3.5 w-3.5" /> Complaint
              </button>
            )}
            {data.actions.canDownloadReceipt && (
              <button type="button" onClick={() => onAction("receipt")} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DDD2] px-4 py-2 text-xs font-extrabold text-[#252423] transition hover:bg-[#F7F2EA]">
                <Receipt className="h-3.5 w-3.5" /> Receipt
              </button>
            )}
            {data.actions.canRebook && (
              <button type="button" onClick={() => onAction("rebook")} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DDD2] px-4 py-2 text-xs font-extrabold text-[#252423] transition hover:bg-[#F7F2EA]">
                <RotateCcw className="h-3.5 w-3.5" /> Rebook
              </button>
            )}
          </div>
        </div>
      )}
    </HubModal>
  );
}
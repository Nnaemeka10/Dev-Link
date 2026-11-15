"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  CalendarDays, Clock, MapPin, MessageCircle, Receipt, RotateCcw, Star, Undo2, Flag, Eye,
} from "lucide-react";
import StatusPill from "./StatusPill";
import type { MyBookingItem } from "../saved.types";

const FALLBACK = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80";

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}
function naira(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

export type BookingActionType = "details" | "chat" | "refund" | "review" | "complaint" | "receipt" | "rebook";

interface BookingCardProps {
  booking: MyBookingItem;
  index: number;
  onAction: (type: BookingActionType, booking: MyBookingItem) => void;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
  primary,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-extrabold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "bg-[#B9401D] text-white hover:brightness-95"
          : "border border-[#E8DDD2] text-[#252423] hover:bg-[#F7F2EA]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export default function BookingCard({ booking, index, onAction }: BookingCardProps) {
  const cancelled = booking.bucket === "cancelled";
  const dateLabel =
    booking.startDate === booking.endDate
      ? fmtDate(booking.startDate)
      : `${fmtDate(booking.startDate)} – ${fmtDate(booking.endDate)}`;
  const timeLabel = [fmtTime(booking.startTime), fmtTime(booking.endTime)].filter(Boolean).join(" – ");
  const refundPending = booking.refundStatus === "pending" || booking.refundStatus === "approved" || booking.refundStatus === "processing";
  const refundClosedTitle = !booking.refundWindowOpen
    ? "Refund window closed — available until 24 hours after the event ends"
    : refundPending
      ? "A refund request is already in progress"
      : undefined;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`overflow-hidden rounded-[1.75rem] border border-[#F0E9DF] bg-white shadow-[0_10px_30px_rgba(36,28,18,0.05)] transition-shadow hover:shadow-[0_18px_44px_rgba(36,28,18,0.09)] ${cancelled ? "opacity-90" : ""}`}
    >
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#EFE7DE] sm:h-28 sm:w-28">
          <Image src={booking.listingImage || FALLBACK} alt={booking.listingTitle} fill sizes="112px" className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-[#252423] sm:text-base">{booking.listingTitle}</h3>
              <p className="mt-0.5 truncate text-xs font-semibold text-[#9A9AAE]">
                {booking.vendorName} · {booking.kind === "hall" ? "Hall" : "Service"}
              </p>
            </div>
            <StatusPill status={booking.status} />
          </div>

          <div className="mt-3 grid gap-1.5 text-xs font-semibold text-[#5E6588]">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#B9401D]" /> {dateLabel}
              {booking.excludedDates.length > 0 && (
                <span className="rounded-full bg-[#F7F2EA] px-2 py-0.5 text-[10px] font-bold text-[#9A9AAE]">
                  {booking.excludedDates.length} day{booking.excludedDates.length > 1 ? "s" : ""} removed
                </span>
              )}
            </span>
            {timeLabel && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-[#B9401D]" /> {timeLabel}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#B9401D]" />
              <span className="truncate">
                {booking.location || (booking.kind === "service" ? "Location to be added" : "Location unavailable")}
              </span>
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-extrabold text-[#252423]">{naira(booking.totalAmount)}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C4BBAE]">{booking.bookingReference}</p>
          </div>
        </div>
      </div>

      {booking.refundStatus && (
        <div className="mx-4 mb-3 rounded-xl bg-[#F7F2EA] px-3 py-2 text-[11px] font-bold text-[#6B5F57] sm:mx-5">
          Refund {booking.refundStatus === "completed" ? "processed" : booking.refundStatus}
          {booking.refundStatus === "pending" && " — under review by support"}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[#F0E9DF] bg-[#FDFBF7] px-4 py-3 sm:px-5">
        <ActionButton icon={Eye} label="Details" primary onClick={() => onAction("details", booking)} />
        {booking.actions.canChat && (
          <ActionButton icon={MessageCircle} label="Chat" onClick={() => onAction("chat", booking)} />
        )}
        {booking.actions.canRequestRefund && (
          <ActionButton icon={Undo2} label="Refund" onClick={() => onAction("refund", booking)} />
        )}
        {!booking.actions.canRequestRefund && booking.bucket !== "cancelled" && (
          <ActionButton icon={Undo2} label="Refund" disabled title={refundClosedTitle} onClick={() => {}} />
        )}
        {booking.actions.canReview && (
          <ActionButton
            icon={Star}
            label={booking.hasReview ? "Edit review" : "Rate & review"}
            onClick={() => onAction("review", booking)}
          />
        )}
        {booking.actions.canComplaint && (
          <ActionButton icon={Flag} label="Complaint" onClick={() => onAction("complaint", booking)} />
        )}
        {booking.actions.canDownloadReceipt && (
          <ActionButton icon={Receipt} label="Receipt" onClick={() => onAction("receipt", booking)} />
        )}
        {booking.actions.canRebook && (
          <ActionButton icon={RotateCcw} label="Rebook" onClick={() => onAction("rebook", booking)} />
        )}
      </div>
    </motion.article>
  );
}
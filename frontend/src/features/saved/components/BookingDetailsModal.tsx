"use client";
import { CalendarDays, Clock, MapPin, User, Hash, Receipt, Star, Undo2, Flag, MessageCircle, RotateCcw } from "lucide-react";
import HubModal from "./HubModal";
import StatusPill from "./StatusPill";
import { useHubBookingDetails } from "../hooks/useSavedHub";
import type { BookingActionType } from "./BookingCard";

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(t: string | null): string {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}
function naira(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" />
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-[#252423]">{value}</p>
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
              <p className="text-xs font-semibold text-[#9A9AAE]">{data.kind === "hall" ? "Hall" : "Service"} · {data.vendorName}</p>
            </div>
            <StatusPill status={data.status} />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Row icon={CalendarDays} label="Dates" value={data.startDate === data.endDate ? fmtDate(data.startDate) : `${fmtDate(data.startDate)} → ${fmtDate(data.endDate)}`} />
            <Row icon={Clock} label="Time" value={`${fmtTime(data.startTime)} – ${fmtTime(data.endTime)}`} />
            <Row icon={MapPin} label={data.kind === "hall" ? "Venue location" : "Event location"} value={data.location || "Location to be added"} />
            <Row icon={User} label="Vendor" value={data.vendorName} />
            {data.packageName && <Row icon={Hash} label="Package" value={data.packageName} />}
            <Row icon={Hash} label="Reference" value={data.bookingReference} />
          </div>

          {data.excludedDates.length > 0 && (
            <div className="rounded-2xl bg-[#F7F2EA] px-4 py-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">Removed days (not charged)</p>
              <p className="mt-1 text-sm font-bold text-[#252423]">
                {data.excludedDates.map((d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })).join(", ")}
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
            </div>
          )}

          {data.refund && (
            <div className="rounded-2xl bg-[#F7F2EA] px-4 py-3 text-sm font-semibold text-[#6B5F57]">
              Refund {data.refund.status}
              {data.refund.status === "pending" && " — support is reviewing your request."}
            </div>
          )}

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
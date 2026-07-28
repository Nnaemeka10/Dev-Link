import type { BookingStatus } from "../types";

const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  funds_held: "bg-violet-100 text-violet-700",
  paid: "bg-emerald-100 text-emerald-700",
  processing_payout: "bg-cyan-100 text-cyan-700",
  payout_released: "bg-teal-100 text-teal-700",
  refunded: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};


const STATUS_DOT: Record<BookingStatus, string> = {
  confirmed: "bg-emerald-600",
  pending: "bg-amber-600 animate-pulse",
  completed: "bg-blue-600",
  cancelled: "bg-red-600",
  funds_held: "bg-violet-600",
  paid: "bg-emerald-600",
  processing_payout: "bg-cyan-600",
  payout_released: "bg-teal-600",
  refunded: "bg-gray-600",
  failed: "bg-red-600",
  expired: "bg-gray-600",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  funds_held: "Funds Held",
  paid: "Paid",
  processing_payout: "Processing",
  payout_released: "Released",
  refunded: "Refunded",
  failed: "Failed",
  expired: "Expired",
};

export default function BookingStatusPill({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
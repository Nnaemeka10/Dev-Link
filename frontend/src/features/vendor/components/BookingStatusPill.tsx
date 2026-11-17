import type { BookingStatus } from "../types";

/**
 * Same soft palette as the customer's saved-hub pill, so a status reads
 * identically on both sides of the marketplace. Labels are vendor-facing:
 * `payout_released` is "Paid out", not the customer's "Completed".
 */
const STYLES: Record<BookingStatus, { wrap: string; dot: string; label: string }> = {
  paid: { wrap: "bg-amber-100 text-amber-700", dot: "bg-amber-600 animate-pulse", label: "Awaiting confirmation" },
  funds_held: { wrap: "bg-amber-100 text-amber-700", dot: "bg-amber-600 animate-pulse", label: "Awaiting confirmation" },
  pending: { wrap: "bg-amber-100 text-amber-700", dot: "bg-amber-600 animate-pulse", label: "Pending" },
  confirmed: { wrap: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-600", label: "Confirmed" },
  completed: { wrap: "bg-blue-100 text-blue-700", dot: "bg-blue-600", label: "Completed" },
  processing_payout: { wrap: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-600", label: "Payout processing" },
  payout_released: { wrap: "bg-teal-100 text-teal-700", dot: "bg-teal-600", label: "Paid out" },
  cancelled: { wrap: "bg-red-100 text-red-700", dot: "bg-red-600", label: "Cancelled" },
  declined: { wrap: "bg-red-100 text-red-700", dot: "bg-red-600", label: "Declined" },
  failed: { wrap: "bg-red-100 text-red-700", dot: "bg-red-600", label: "Failed" },
  refunded: { wrap: "bg-gray-100 text-gray-600", dot: "bg-gray-500", label: "Refunded" },
  expired: { wrap: "bg-gray-100 text-gray-500", dot: "bg-gray-400", label: "Expired" },
};

const FALLBACK = { wrap: "bg-gray-100 text-gray-600", dot: "bg-gray-500", label: "" };

interface BookingStatusPillProps {
  status: BookingStatus | string;
  size?: "sm" | "md";
  className?: string;
}

export default function BookingStatusPill({
  status,
  size = "sm",
  className = "",
}: BookingStatusPillProps) {
  const meta = STYLES[status as BookingStatus] ?? {
    ...FALLBACK,
    label: String(status).replace(/_/g, " "),
  };
  const sizing =
    size === "md"
      ? "px-3.5 py-1.5 text-[11px]"
      : "px-2.5 py-1 text-[10px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-extrabold uppercase tracking-wider ${sizing} ${meta.wrap} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
const STYLES: Record<string, { bg: string; dot: string; label: string }> = {
  confirmed: { bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-600", label: "Confirmed" },
  paid: { bg: "bg-amber-100 text-amber-700", dot: "bg-amber-600 animate-pulse", label: "Awaiting confirmation" },
  funds_held: { bg: "bg-amber-100 text-amber-700", dot: "bg-amber-600 animate-pulse", label: "Awaiting confirmation" },
  pending: { bg: "bg-amber-100 text-amber-700", dot: "bg-amber-600 animate-pulse", label: "Pending" },
  completed: { bg: "bg-blue-100 text-blue-700", dot: "bg-blue-600", label: "Completed" },
  processing_payout: { bg: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-600", label: "Processing" },
  payout_released: { bg: "bg-teal-100 text-teal-700", dot: "bg-teal-600", label: "Completed" },
  cancelled: { bg: "bg-red-100 text-red-700", dot: "bg-red-600", label: "Cancelled" },
  declined: { bg: "bg-red-100 text-red-700", dot: "bg-red-600", label: "Declined" },
  refunded: { bg: "bg-gray-100 text-gray-600", dot: "bg-gray-500", label: "Refunded" },
  failed: { bg: "bg-red-100 text-red-700", dot: "bg-red-600", label: "Failed" },
  expired: { bg: "bg-gray-100 text-gray-500", dot: "bg-gray-400", label: "Expired" },
};

export default function StatusPill({ status }: { status: string }) {
  const s = STYLES[status] ?? { bg: "bg-gray-100 text-gray-600", dot: "bg-gray-500", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
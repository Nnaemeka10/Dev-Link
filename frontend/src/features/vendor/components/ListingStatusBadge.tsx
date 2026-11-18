import { Clock3 } from "lucide-react";
import type { VendorListingStatus } from "../types";

/**
 * One badge language for every listing surface. `unlisted` is the vendor's
 * own archived state (they can relist it); `offline` means WE suspended it.
 * Designed to sit on top of a photo, so every variant carries its own
 * opaque/blurred backing rather than relying on the image behind it.
 */
const STYLES: Record<
  VendorListingStatus,
  { wrap: string; dot: string; label: string }
> = {
  active: {
    wrap: "bg-white/92 text-[#2D5A27]",
    dot: "bg-[#2D5A27]",
    label: "Live",
  },
  draft: {
    wrap: "bg-white/92 text-[#6B5F57]",
    dot: "bg-[#C4BBAE]",
    label: "Draft",
  },
  in_review: {
    wrap: "bg-amber-400/95 text-amber-950",
    dot: "bg-amber-900",
    label: "In review",
  },
  rejected: {
    wrap: "bg-red-500/95 text-white",
    dot: "bg-white",
    label: "Needs changes",
  },
  unlisted: {
    wrap: "bg-[#252423]/85 text-white",
    dot: "bg-white/60",
    label: "Unlisted",
  },
  offline: {
    wrap: "bg-[#252423]/85 text-white",
    dot: "bg-red-400",
    label: "Suspended",
  },
};

export default function ListingStatusBadge({
  status,
  className = "",
}: {
  status: VendorListingStatus;
  className?: string;
}) {
  const meta = STYLES[status] ?? STYLES.offline;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-sm ${meta.wrap} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

/** A staged edit is awaiting moderation; the approved version keeps serving. */
export function PendingEditsBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#FFF1E6]/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#B9401D] shadow-sm backdrop-blur-sm ${className}`}
    >
      <Clock3 className="h-3 w-3 shrink-0" aria-hidden="true" />
      Edits pending
    </span>
  );
}
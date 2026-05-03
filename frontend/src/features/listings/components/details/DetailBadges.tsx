import { Check, Star } from "lucide-react";

export function RatingBadge({ rating, reviewsCount }: { rating: string; reviewsCount: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEECE7] px-3 py-1.5 text-sm font-extrabold text-[#252423]">
      <Star className="h-4 w-4 fill-[#9D6B00] text-[#9D6B00]" />
      {rating}
      <span className="font-semibold text-[#6B6E91]">({reviewsCount})</span>
    </span>
  );
}

export function VerifiedVenueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F4DFD2] px-3 py-1.5 text-xs font-extrabold text-[#B9401D]">
      <Check className="h-3.5 w-3.5 rounded-full bg-[#B9401D] p-0.5 text-white" />
      Verified
    </span>
  );
}

export function ListingBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#FFE7B5] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#6E4A12]">
      {children}
    </span>
  );
}

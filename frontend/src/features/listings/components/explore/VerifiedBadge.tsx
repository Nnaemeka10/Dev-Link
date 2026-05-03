import { Check } from "lucide-react";

export default function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#B9401D] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white">
      <Check className="h-3 w-3 rounded-full bg-white p-0.5 text-[#B9401D]" />
      Verified
    </span>
  );
}

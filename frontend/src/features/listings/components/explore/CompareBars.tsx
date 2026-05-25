import Image from "next/image";
import { Plus } from "lucide-react";
import type { ExploreListing } from "../../explore.types";

interface CompareBarProps {
  selectedListings: ExploreListing[];
  onClear: () => void;
}

export function MobileCompareBar({ selectedListings, onClear }: CompareBarProps) {
  if (selectedListings.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-[4.9rem] z-40 rounded-full bg-white/95 p-2 shadow-[0_10px_30px_rgba(44,36,24,0.18)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 px-2">
          <p className="truncate text-xs font-extrabold text-[#2C2926]">
            Compare <span className="text-[#B9401D]">({selectedListings.length} selected)</span>
          </p>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#6B6E91]"
          >
            Clear All
          </button>
        </div>
        <button type="button" className="rounded-full bg-[#B9401D] px-7 py-4 text-xs font-extrabold uppercase text-white">
          Compare Now
        </button>
      </div>
    </div>
  );
}

export function DesktopCompareBar({ selectedListings, onClear }: CompareBarProps) {
  if (selectedListings.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-40 flex min-w-[42rem] -translate-x-1/2 items-center gap-6 rounded-full bg-[#1C1C18] px-8 py-4 text-white shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
      <div className="flex items-center gap-2">
        {selectedListings.slice(0, 2).map((listing) => (
          <Image key={listing.id} src={listing.image} alt={listing.name} className="h-8 w-8 rounded-full object-cover" />
        ))}
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-white/30 text-white/70"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="h-8 w-px bg-white/20" />
      <p className="min-w-[10rem] text-sm font-extrabold">{selectedListings.length} Items Selected</p>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-xs font-extrabold uppercase tracking-[0.18em] text-white/55"
      >
        Clear All
      </button>
      <button type="button" className="rounded-full bg-[#B9401D] px-7 py-3 text-sm font-extrabold">
        Compare Now
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import type { ExploreListing } from "../../explore.types";
import { MAX_COMPARE } from "../../utils/compareSelection";
import { CompareModal } from "./CompareModal";

// Matches the fallback used across the explore components.
const FALLBACK_IMAGE = "../../../../assets/home/curatedeventsa.png";

interface CompareBarProps {
  selectedListings: ExploreListing[];
  onClear: () => void;
}

/** One selection slot , a thumbnail when filled, a dashed "+" when empty. */
function CompareSlot({ listing, dark = false }: { listing?: ExploreListing; dark?: boolean }) {
  if (!listing) {
    return (
      <span
        className={
          dark
            ? "inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-white/30 text-white/70"
            : "inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-[#CFC7BD] text-[#9A9AAE]"
        }
      >
        <Plus className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <Image
      src={listing.imageUrl ?? FALLBACK_IMAGE}
      alt={listing.name}
      width={32}
      height={32}
      className="h-8 w-8 rounded-full object-cover"
    />
  );
}

export function MobileCompareBar({ selectedListings, onClear }: CompareBarProps) {
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  if (selectedListings.length === 0) {
    return null;
  }

  const canCompare = selectedListings.length >= MAX_COMPARE;

  return (
    <>
      <div className="fixed inset-x-4 bottom-[4.9rem] z-40 rounded-full bg-white/95 p-2 shadow-[0_10px_30px_rgba(44,36,24,0.18)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex shrink-0 items-center gap-1.5 pl-1">
              {Array.from({ length: MAX_COMPARE }, (_, slot) => (
                <CompareSlot key={slot} listing={selectedListings[slot]} />
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-[#2C2926]">
                Compare <span className="text-[#B9401D]">({selectedListings.length}/{MAX_COMPARE})</span>
              </p>
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#6B6E91]"
              >
                Clear All
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={!canCompare}
            onClick={() => setIsCompareOpen(true)}
            className="shrink-0 rounded-full bg-[#B9401D] px-7 py-4 text-xs font-extrabold uppercase text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {canCompare ? "Compare Now" : `Select ${MAX_COMPARE - selectedListings.length} more`}
          </button>
        </div>
      </div>

      <CompareModal
        isOpen={isCompareOpen && canCompare}
        onClose={() => setIsCompareOpen(false)}
        listings={selectedListings.slice(0, MAX_COMPARE)}
      />
    </>
  );
}

export function DesktopCompareBar({ selectedListings, onClear }: CompareBarProps) {
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  if (selectedListings.length === 0) {
    return null;
  }

  const canCompare = selectedListings.length >= MAX_COMPARE;

  return (
    <>
      <div className="fixed bottom-20 left-1/2 z-40 flex min-w-2xl -translate-x-1/2 items-center gap-6 rounded-full bg-[#1C1C18] px-8 py-4 text-white shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
        <div className="flex items-center gap-2">
          {Array.from({ length: MAX_COMPARE }, (_, slot) => (
            <CompareSlot key={slot} listing={selectedListings[slot]} dark />
          ))}
        </div>
        <div className="h-8 w-px bg-white/20" />
        <p className="min-w-40 text-sm font-extrabold">
          {selectedListings.length} of {MAX_COMPARE} selected
        </p>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-xs font-extrabold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-white"
        >
          Clear All
        </button>
        <button
          type="button"
          disabled={!canCompare}
          onClick={() => setIsCompareOpen(true)}
          className="rounded-full bg-[#B9401D] px-7 py-3 text-sm font-extrabold transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {canCompare ? "Compare Now" : `Select ${MAX_COMPARE - selectedListings.length} more`}
        </button>
      </div>

      <CompareModal
        isOpen={isCompareOpen && canCompare}
        onClose={() => setIsCompareOpen(false)}
        listings={selectedListings.slice(0, MAX_COMPARE)}
      />
    </>
  );
}
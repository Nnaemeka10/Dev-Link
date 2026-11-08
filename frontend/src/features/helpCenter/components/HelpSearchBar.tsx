"use client";

import { Search, X } from "lucide-react";

interface HelpSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HelpSearchBar({ value, onChange }: HelpSearchBarProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-primary/40" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search help articles , try “refund” or “escrow”"
        aria-label="Search help articles"
        className="w-full rounded-full border border-[#F1E5D5] bg-white py-4 pl-14 pr-12 text-sm text-text-primary shadow-card outline-none transition-shadow placeholder:text-text-primary/40 focus:shadow-card-hover focus:ring-2 focus:ring-accent-primary/40 [&::-webkit-search-cancel-button]:hidden"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-bg-tertiary text-text-primary/60 transition-colors hover:bg-surface-dim hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
"use client";

import { Search } from "lucide-react";

interface CollapsedSearchPillProps {
  summary: string[];
  onExpand: () => void;
}

/** Compact pill shown while the explore header is scroll-collapsed. */
export default function CollapsedSearchPill({ summary, onExpand }: CollapsedSearchPillProps) {
  const hasSummary = summary.length > 0;
  return (
    <button
      type="button"
      onClick={onExpand}
      className="motion-safe:animate-fade-up flex h-12 w-full max-w-xl items-center gap-3 rounded-full border border-[#F1E5D5] bg-white px-4 py-2 text-left shadow-card transition-shadow hover:shadow-card-hover"
      aria-label={hasSummary ? `Edit search: ${summary.join(", ")}` : "Start your search"}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-primary text-white">
        <Search className="h-4 w-4" />
      </span>
      {hasSummary ? (
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
          {summary.join(" · ")}
        </span>
      ) : (
        <span className="flex-1 text-sm font-semibold text-text-primary/60">Start your search</span>
      )}
      <span className="shrink-0 rounded-full border border-text-primary/15 px-3 py-1 text-xs font-semibold text-text-primary/70">
        Edit
      </span>
    </button>
  );
}
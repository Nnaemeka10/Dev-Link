"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationState } from "../types";

interface VendorPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  /** Noun for the range line: "bookings", "payouts". */
  itemLabel?: string;
  /** Unique per surface so the sliding active pill never collides. */
  layoutId?: string;
  className?: string;
}

type Item = number | `gap-${number}`;

/**
 * Windowed page numbers with ellipses: 1 … 4 5 6 … 12.
 * Neighbours of the current page are desktop-only, so the mobile row collapses
 * to 1 … 5 … 12 and never overflows a 320px viewport.
 */
function buildItems(current: number, total: number): Item[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = [1, total, current - 1, current, current + 1]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const unique = [...new Set(wanted)];
  const out: Item[] = [];
  let prev = 0;
  for (const n of unique) {
    if (prev && n - prev > 1) out.push(`gap-${n}`);
    out.push(n);
    prev = n;
  }
  return out;
}

export default function VendorPagination({
  pagination,
  onPageChange,
  itemLabel = "bookings",
  layoutId = "vendor-pagination-active",
  className = "",
}: VendorPaginationProps) {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
  const safeTotal = Math.max(1, totalPages);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, totalItems);
  const items = buildItems(currentPage, safeTotal);

  const arrowClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8DDD2] bg-white text-[#5E6588] transition-all hover:border-[#B9401D]/40 hover:text-[#B9401D] active:scale-95 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${className}`}
    >
      <p className="text-tiny font-semibold text-[#9A9AAE] md:text-xs">
        {totalItems === 0
          ? `No ${itemLabel}`
          : `Showing ${rangeStart}–${rangeEnd} of ${totalItems} ${itemLabel}`}
      </p>

      {safeTotal > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={arrowClass}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {items.map((item) => {
            if (typeof item !== "number") {
              return (
                <span
                  key={item}
                  aria-hidden="true"
                  className="flex h-9 w-5 items-center justify-center text-xs font-bold text-[#C4BBAE]"
                >
                  …
                </span>
              );
            }
            const isActive = item === currentPage;
            const isEssential = item === 1 || item === safeTotal || isActive;
            return (
              <button
                key={item}
                type="button"
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${item}`}
                onClick={() => onPageChange(item)}
                className={`relative h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors active:scale-95 ${
                  isEssential ? "flex" : "hidden sm:flex"
                } ${
                  isActive
                    ? "text-white"
                    : "text-[#5E6588] hover:bg-[#F7F2EA] hover:text-[#252423]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-full bg-[#B9401D]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10 tabular-nums">{item}</span>
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= safeTotal}
            onClick={() => onPageChange(currentPage + 1)}
            className={arrowClass}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import type { SortBy, SortOrder } from "@/features/listings/searchParams";

interface SortDropdownProps {
  currentSort?: SortBy;
  currentSortOrder?: SortOrder;
  onSort: (sort: SortBy, order: SortOrder) => void;
}

type SortOption = { label: string; sort: SortBy; order: SortOrder };
const SORT_OPTIONS: SortOption[] = [
  { label: "Recommended", sort: "recommended", order: "desc" },
  { label: "Price: Low to High", sort: "price", order: "asc" },
  { label: "Price: High to Low", sort: "price", order: "desc" },
  { label: "Rating: High to Low", sort: "rating", order: "desc" },
  { label: "Rating: Low to High", sort: "rating", order: "asc" },
  { label: "Most Reviewed", sort: "reviews", order: "desc" },
  { label: "Newest", sort: "newest", order: "desc" },
];

const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40";

export function SortDropdown({ currentSort, currentSortOrder, onSort }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();

  const effectiveSort: SortBy = currentSort ?? "recommended";
  const effectiveOrder: SortOrder = currentSortOrder ?? "desc";

  const isOptionSelected = (option: SortOption) =>
    option.sort === effectiveSort &&
    (option.sort === "recommended" || option.order === effectiveOrder);

  const selectedIndex = SORT_OPTIONS.findIndex(isOptionSelected);
  const currentLabel =
    effectiveSort === "recommended"
      ? "Recommended"
      : SORT_OPTIONS[selectedIndex]?.label ?? "Recommended";

  // Outside click + Escape, with NO full-screen overlay. An overlay layered
  // above the menu swallows option clicks and makes sorting unreachable.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // On open, move focus to the currently-selected option.
  useEffect(() => {
    if (!isOpen) return;
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(index);
    const frame = requestAnimationFrame(() => optionRefs.current[index]?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen, selectedIndex]);

  const handleSelect = (option: SortOption) => {
    onSort(option.sort, option.order);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const focusOption = (index: number) => {
    const clamped = Math.max(0, Math.min(SORT_OPTIONS.length - 1, index));
    setActiveIndex(clamped);
    optionRefs.current[clamped]?.focus();
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusOption(activeIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusOption(activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusOption(0);
        break;
      case "End":
        event.preventDefault();
        focusOption(SORT_OPTIONS.length - 1);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className="flex items-center gap-1 rounded-full text-micro font-extrabold text-[#A83A1C] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9401D] lg:text-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={`Sort listings: ${currentLabel}`}
      >
        <span className="whitespace-nowrap">{currentLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label="Sort listings"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onKeyDown={handleMenuKeyDown}
            className={`absolute right-0 top-full z-50 mt-2 max-h-[min(60vh,22rem)] w-64 origin-top-right overflow-y-auto rounded-2xl border border-[#E8DFD3] bg-white py-2 shadow-[0_18px_44px_rgba(34,27,18,0.16)] ${SCROLLBAR}`}
          >
            <p className="px-4 pb-1 pt-2 text-nano font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
              Sort by
            </p>
            {SORT_OPTIONS.map((option, index) => {
              const isSelected = isOptionSelected(option);
              return (
                <button
                  key={`${option.sort}-${option.order}`}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={index === activeIndex ? 0 : -1}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#B9401D] ${
                    isSelected
                      ? "bg-[#FFDFA7] text-[#252423]"
                      : "text-[#555B7F] hover:bg-[#F5F0E8] focus-visible:bg-[#F5F0E8]"
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-[#A83A1C]" aria-hidden="true" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
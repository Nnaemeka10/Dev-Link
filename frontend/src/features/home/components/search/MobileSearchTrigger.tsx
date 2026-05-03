"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

import { useHomeStore } from "../../store/homeStore";

interface MobileSearchTriggerProps {
  mobileSummaryLines: string[];
}

/**
 * MobileSearchTrigger: Collapsed mobile search input button
 *
 * Displays:
 * - "Begin your search" placeholder
 * - Location and date summary if selected
 * - Opens fullscreen modal when clicked
 */
export default function MobileSearchTrigger({
  mobileSummaryLines,
}: MobileSearchTriggerProps) {
  const setIsMobileSearchOpen = useHomeStore((state) => state.setIsMobileSearchOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 }}
      className="mx-auto w-full max-w-xl md:hidden"
    >
      <button
        type="button"
        onClick={() => setIsMobileSearchOpen(true)}
        className="flex w-full items-center gap-4 rounded-full bg-white px-5 py-4 text-left shadow-[0_10px_26px_rgba(26,31,60,0.12)]"
      >
        <Search className="h-5 w-5 text-text-primary/50" />
        <div className="flex-col hidden 2xs:flex">
          
          {mobileSummaryLines.length > 0 ? (
            <div className="mt-1 space-y-0.5 text-tiny  text-text-primary flex flex-wrap">
              {mobileSummaryLines.map((line) => (
                <p key={line} className="mr-4">{line}</p>
              ))}
            </div>
          ) : <span className="text-sm font-semibold text-text-primary/60">
                Begin your search
              </span>}
        </div>

        <div className="flex-col 2xs:hidden flex">
          <span className="text-sm font-semibold text-text-primary/60">
                Begin your search
            </span>
        </div>
      </button>
    </motion.div>
  );
}

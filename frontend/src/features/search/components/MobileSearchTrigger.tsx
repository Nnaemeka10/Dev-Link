"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

import { useSearchStore } from "../store/useSearchStore";

interface MobileSearchTriggerProps {
  mobileSummaryLines: {label: string; value: string}[];
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
  const setIsMobileSearchOpen = useSearchStore((state) => state.setIsMobileSearchOpen);
  
  
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
        <Search className="h-6 w-6 text-text-primary/50" />
        <div className="flex-col hidden xs:flex">
          
          {mobileSummaryLines.length > 0 ? (
            <div className="mt-1 text-small font-600 text-text-primary flex flex-wrap">
              {mobileSummaryLines.map((item, index) => (
                <div 
                  key={`${item.label}-${index}`} 
                  className={`px-2 border-gray-400 ${
                    index === mobileSummaryLines.length - 1 ? 'border-0' : 'border-r'
                  }`}
                >
                  {/* Key/Label on top */}
                  <p className="text-text-primary/60 uppercase text-micro">
                    {item.label}
                  </p>
                  {/* Value below */}
                  <p className="font-medium tracking-wider text-body">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm font-semibold text-text-primary/60">
              Begin your search
            </span>
          )}
        </div>

        <div className="flex-col xs:hidden flex">
          <span className="text-sm font-semibold text-text-primary/60">
                Begin your search
            </span>
        </div>
      </button>
    </motion.div>
  );
}

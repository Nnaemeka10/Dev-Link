"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Receipt } from "lucide-react";
import type { Transaction, TransactionIcon } from "../types";
import { EASE_OUT, VENDOR_CARD, formatCurrency, formatDay } from "../utils";

const ICON_PATHS: Record<TransactionIcon, string> = {
  venue: "M4 21V9L12 3L20 9V21H14V14H10V21H4Z",
  photography:
    "M4 8H7L8.5 5.5H15.5L17 8H20V19H4V8Z M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z",
  sound: "M9 6L4 9H2V15H4L9 18V6Z M15 9C16.2 9.9 17 11.4 17 13C17 14.6 16.2 16.1 15 17",
  hosting: "M12 3L14.5 8.5L20.5 9.3L16 13.2L17.3 19.2L12 16L6.7 19.2L8 13.2L3.5 9.3L9.5 8.5L12 3Z",
  design: "M3 17L9 11L13 15L21 7 M21 7H15 M21 7V13",
  withdrawal: "M12 4V16 M12 16L7 11 M12 16L17 11 M4 20H20",
};

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
  totalItems?: number;
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#EFE7DE]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#EFE7DE]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-[#EFE7DE]" />
      </div>
      <div className="h-4 w-16 animate-pulse rounded bg-[#EFE7DE]" />
    </div>
  );
}

export default function TransactionHistory({
  transactions,
  isLoading = false,
  totalItems,
}: TransactionHistoryProps) {
  return (
    <section className={`${VENDOR_CARD} p-5 md:p-7`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
            Transaction history
          </h2>
          <p className="mt-0.5 text-tiny font-semibold text-[#9A9AAE]">
            Completed payouts to your bank
          </p>
        </div>
        <Link
          href="/vendor/transactions"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F7F2EA] px-3.5 py-2 text-[11px] font-extrabold text-[#B9401D] transition-all hover:brightness-95 active:scale-95"
        >
          View all
          {typeof totalItems === "number" && totalItems > 0 ? ` (${totalItems})` : ""}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#E0D5C7] bg-[#FDFBF7] px-5 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
              <Receipt className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-extrabold text-[#252423]">No payouts yet</p>
            <p className="mt-1 max-w-xs text-tiny font-semibold leading-5 text-[#9A9AAE]">
              Payouts land here once an event completes and its 24-hour dispute
              window closes.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {transactions.map((txn, index) => (
              <motion.li
                key={txn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06, ease: EASE_OUT }}
              >
                <Link
                  href={`/vendor/transactions/${txn.id}`}
                  className="group flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-[#F7F2EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9401D]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F1EA] text-[#B9401D]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d={ICON_PATHS[txn.icon]}
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-[#252423]">
                      {txn.listingTitle ?? txn.title}
                    </span>
                    <span className="mt-0.5 block truncate text-tiny font-semibold text-[#9A9AAE]">
                      {formatDay(txn.date)} · {txn.referenceId}
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-extrabold tabular-nums text-[#252423]">
                      + {formatCurrency(txn.amount)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                      Completed
                    </span>
                  </span>

                  <ChevronRight
                    className="hidden h-4 w-4 shrink-0 text-[#C4BBAE] transition-transform group-hover:translate-x-0.5 group-hover:text-[#B9401D] sm:block"
                    aria-hidden="true"
                  />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
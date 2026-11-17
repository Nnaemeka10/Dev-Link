"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  CloudOff,
  LockKeyhole,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import VendorPageShell from "../components/VendorPageShell";
import VendorPagination from "../components/VendorPagination";
import {
  VENDOR_PAGE_SIZE,
  useVendorSummary,
  useVendorTransactions,
} from "../hooks/useVendorDashboard";
import type { Transaction, TransactionIcon } from "../types";
import {
  EASE_OUT,
  VENDOR_CARD,
  formatCurrency,
  formatDay,
} from "../utils";

const ICON_PATHS: Record<TransactionIcon, string> = {
  venue: "M4 21V9L12 3L20 9V21H14V14H10V21H4Z",
  photography:
    "M4 8H7L8.5 5.5H15.5L17 8H20V19H4V8Z M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z",
  sound: "M9 6L4 9H2V15H4L9 18V6Z M15 9C16.2 9.9 17 11.4 17 13C17 14.6 16.2 16.1 15 17",
  hosting: "M12 3L14.5 8.5L20.5 9.3L16 13.2L17.3 19.2L12 16L6.7 19.2L8 13.2L3.5 9.3L9.5 8.5L12 3Z",
  design: "M3 17L9 11L13 15L21 7 M21 7H15 M21 7V13",
  withdrawal: "M12 4V16 M12 16L7 11 M12 16L17 11 M4 20H20",
};

const EMPTY_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: VENDOR_PAGE_SIZE,
};

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#F0E9DF] bg-white p-4">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#EFE7DE]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#EFE7DE]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#EFE7DE]" />
      </div>
      <div className="h-5 w-20 animate-pulse rounded bg-[#EFE7DE]" />
    </div>
  );
}

function TransactionRow({ txn, index }: { txn: Transaction; index: number }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.3),
        ease: EASE_OUT,
      }}
    >
      <Link
        href={`/vendor/transactions/${txn.id}`}
        className="group flex items-center gap-3 rounded-2xl border border-[#F0E9DF] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#B9401D]/25 hover:shadow-[0_14px_30px_rgba(36,28,18,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9401D]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F4F1EA] text-[#B9401D]">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          <span className="block truncate text-sm font-extrabold text-[#252423] transition-colors group-hover:text-[#B9401D]">
            {txn.listingTitle ?? txn.title}
          </span>
          <span className="mt-0.5 block truncate text-tiny font-semibold text-[#9A9AAE]">
            {formatDay(txn.date)}
            {txn.clientName ? ` · ${txn.clientName}` : ""}
          </span>
          <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-wider text-[#C4BBAE]">
            {txn.referenceId}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-sm font-extrabold tabular-nums text-[#252423] md:text-base">
            + {formatCurrency(txn.amount)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
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
  );
}

export default function VendorTransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useVendorTransactions(
    page,
    VENDOR_PAGE_SIZE
  );
  const { data: summary } = useVendorSummary();

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination ?? EMPTY_PAGINATION;

  return (
    <VendorPageShell back={{ href: "/vendor", label: "Back to dashboard" }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <h1 className="font-man text-2xl font-extrabold tracking-tight text-[#252423] md:text-3xl">
          Transactions
        </h1>
        <p className="mt-1.5 text-sm font-semibold text-[#9A9AAE]">
          Every completed payout to your bank account, newest first.
        </p>
      </motion.div>

      {/* Money band - same espresso family as the dashboard hero */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-[#2A211B] via-[#241C16] to-[#1B1410] p-5 text-white shadow-[0_18px_44px_rgba(36,28,18,0.22)] md:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(201,153,58,0.32),transparent_65%)] blur-2xl"
        />
        <div className="relative grid grid-cols-2 gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/50">
              <Wallet className="h-3.5 w-3.5 text-[#E8B44A]" aria-hidden="true" />
              Paid out
            </p>
            <p className="mt-2 font-man text-xl font-black tabular-nums text-bg-secondary xs:text-2xl md:text-3xl">
              {formatCurrency(summary?.totalPaidOut ?? 0)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/50">
              <LockKeyhole className="h-3.5 w-3.5 text-[#C9993A]" aria-hidden="true" />
              In escrow
            </p>
            <p className="mt-2 font-man text-xl font-black tabular-nums text-[#E8B44A] xs:text-2xl md:text-3xl">
              {formatCurrency(summary?.inEscrow ?? 0)}
            </p>
          </div>
        </div>
        <p className="relative mt-4 flex items-start gap-2 border-t border-white/10 pt-4 text-[11px] font-semibold leading-5 text-white/45">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Each row is an immutable ledger entry written when Paystack confirmed the
          transfer. Pending payouts appear on the dashboard, not here.
        </p>
      </motion.section>

      <section className={`${VENDOR_CARD} overflow-hidden`}>
        <div className="border-b border-[#F0E9DF] px-4 py-4 md:px-6">
          <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
            Payout ledger
          </h2>
          <p className="mt-0.5 text-tiny font-semibold text-[#9A9AAE]">
            Tap a payout for the full breakdown, transfer references and receipt
          </p>
        </div>

        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#E0D5C7] bg-[#FDFBF7] px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
                <CloudOff className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-extrabold text-[#252423]">
                Couldn&apos;t load your payouts
              </h3>
              <p className="mt-1 max-w-xs text-tiny font-semibold text-[#9A9AAE]">
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white transition-all hover:brightness-95 active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#E0D5C7] bg-[#FDFBF7] px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
                <Receipt className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-extrabold text-[#252423]">
                No payouts yet
              </h3>
              <p className="mt-1 max-w-sm text-tiny font-semibold leading-5 text-[#9A9AAE]">
                Once an event completes and its 24-hour dispute window closes, we
                transfer your earnings and the record lands here.
              </p>
              <Link
                href="/vendor"
                className="mt-5 rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white transition-all hover:brightness-95 active:scale-95"
              >
                Back to dashboard
              </Link>
            </div>
          ) : (
            <motion.ul layout className="space-y-3">
              {transactions.map((txn, index) => (
                <TransactionRow key={txn.id} txn={txn} index={index} />
              ))}
            </motion.ul>
          )}
        </div>

        <div className="border-t border-[#F0E9DF] bg-[#FDFBF7] px-4 py-4 md:px-6">
          <VendorPagination
            pagination={pagination}
            onPageChange={setPage}
            itemLabel="payouts"
            layoutId="vendor-txn-pagination"
          />
        </div>
      </section>
    </VendorPageShell>
  );
}
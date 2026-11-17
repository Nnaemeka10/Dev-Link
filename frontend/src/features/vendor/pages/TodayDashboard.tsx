"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import DashboardHeading from "../components/DashboardHeading";
import FinancialSummaryCards, {
  FinancialSummarySkeleton,
} from "../components/FinancialSummaryCards";
import TransactionHistory from "../components/TransactionHistory";
import BookingsTable from "../components/BookingsTable";
import VerificationStatusBanner from "../components/VerificationStatusBanner";
import VendorSideNavBar from "@/components/layout/VendorSideNavBar";
import VendorMobileDock from "@/components/layout/VendorMobileDock";
import { useAuth } from "@/features/auth/useAuth";
import {
  DASHBOARD_TXN_COUNT,
  VENDOR_PAGE_SIZE,
  useConfirmBooking,
  useVendorBookings,
  useVendorSummary,
  useVendorTransactions,
} from "../hooks/useVendorDashboard";
import {
  BOOKING_FILTER_LABELS,
  type BookingFilterKey,
  type BookingFilterTab,
  type BookingSortKey,
  type FinancialSummary,
} from "../types";
import { EASE_OUT, VENDOR_CARD, formatDay, formatRelativeDay } from "../utils";

const FILTER_ORDER: BookingFilterKey[] = [
  "pending",
  "upcoming",
  "completed",
  "cancelled",
];

const EMPTY_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: VENDOR_PAGE_SIZE,
};

export default function VendorDashboardPage() {
  const { user } = useAuth();

  // Pending is the actionable queue, so it is the default on every breakpoint.
  const [activeFilter, setActiveFilter] = useState<BookingFilterKey>("pending");
  const [sort, setSort] = useState<BookingSortKey>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const bookingsRef = useRef<HTMLDivElement>(null);

  const { data: summary, isLoading: summaryLoading } = useVendorSummary();
  const { data: txnPage, isLoading: txnLoading } = useVendorTransactions(
    1,
    DASHBOARD_TXN_COUNT
  );
  const { data: bookingsPage, isLoading: bookingsLoading } = useVendorBookings(
    activeFilter,
    currentPage,
    sort,
    VENDOR_PAGE_SIZE
  );
  const confirmBooking = useConfirmBooking();

  const financialSummary: FinancialSummary | null = summary
    ? {
        currencySymbol: "₦",
        totalRevenue: summary.totalRevenue,
        totalPaidOut: summary.totalPaidOut,
        inEscrow: summary.inEscrow,
        totalRevenueChangePercent: summary.revenueChangePercent,
        confirmedBookings: summary.confirmedBookings,
        pendingBookings: summary.pendingBookings,
        pendingBookingsNote: "Paid, awaiting your confirmation",
      }
    : null;

  const bookingFilters: BookingFilterTab[] = FILTER_ORDER.map((key) => ({
    key,
    label: BOOKING_FILTER_LABELS[key],
    count: summary?.filterCounts?.[key] ?? 0,
  }));

  const vendor = {
    id: user?.id?.toString() ?? "",
    name: [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Vendor",
    firstName: user?.firstName?.trim() || "there",
    avatarUrl: user?.avatarUrl ?? "",
    isFirstVisit: false,
    unreadMessages: 0,
  };

  function handleFilterChange(key: BookingFilterKey) {
    setActiveFilter(key);
    setCurrentPage(1);
  }

  function handleSortChange(next: BookingSortKey) {
    setSort(next);
    setCurrentPage(1);
  }

  function reviewPending() {
    handleFilterChange("pending");
    bookingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 xl:block">
        <VendorSideNavBar embedded />
      </aside>

      <div className="xl:pl-64">
        <VendorHeader vendor={vendor} />

        <main className="mx-auto flex max-w-400 flex-col gap-6 px-4 pb-32 pt-6 xs:px-6 md:gap-8 md:px-8 md:pb-12 md:pt-8">
          <DashboardHeading vendor={vendor} />

          <VerificationStatusBanner />

          {summary?.nextPayoutDate && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className={`${VENDOR_CARD} flex items-start gap-4 p-4 sm:items-center sm:p-5`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E6] text-[#B9401D]">
                <CalendarClock className="h-5 w-5 animate-pulse" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#252423]">
                  Next payout {formatRelativeDay(summary.nextPayoutDate)}
                </p>
                <p className="mt-0.5 text-tiny font-semibold leading-5 text-[#9A9AAE]">
                  {summary.nextPayoutListing
                    ? `${summary.nextPayoutListing} - `
                    : ""}
                  released to your bank on {formatDay(summary.nextPayoutDate)}, once the
                  dispute window closes.
                </p>
              </div>
            </motion.div>
          )}

          {summaryLoading || !financialSummary ? (
            <FinancialSummarySkeleton />
          ) : (
            <FinancialSummaryCards
              summary={financialSummary}
              onReviewPending={reviewPending}
            />
          )}

          <TransactionHistory
            transactions={txnPage?.transactions ?? []}
            isLoading={txnLoading}
            totalItems={txnPage?.pagination.totalItems}
          />

          <div ref={bookingsRef} className="scroll-mt-24">
            <BookingsTable
              filters={bookingFilters}
              activeFilterKey={activeFilter}
              sort={sort}
              bookings={bookingsPage?.bookings ?? []}
              pagination={bookingsPage?.pagination ?? EMPTY_PAGINATION}
              isLoading={bookingsLoading}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onPageChange={setCurrentPage}
              onConfirmBooking={(id) => confirmBooking.mutate(id)}
              confirmingBookingId={
                confirmBooking.isPending ? confirmBooking.variables ?? null : null
              }
            />
          </div>
        </main>
      </div>

      <VendorMobileDock />
    </div>
  );
}
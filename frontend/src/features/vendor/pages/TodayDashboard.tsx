"use client";

import { useState } from "react";
import VendorHeader from "../components/VendorHeader";
import DashboardHeading from "../components/DashboardHeading";
import FinancialSummaryCards from "../components/FinancialSummaryCards";
// import RevenueTrendChart from "../components/RevenueTrendChart";
import TransactionHistory from "../components/TransactionHistory";
import BookingsTable from "../components/BookingsTable";
import VendorSideNavBar from "../../../components/layout/VendorSideNavBar";
import VendorMobileDock from "../../../components/layout/VendorMobileDock";
import { useAuth } from "@/features/auth/useAuth";
import { useVendorSummary, useVendorTransactions, useVendorBookings } from "../hooks/useVendorDashboard";
import type { BookingFilterKey, BookingFilterTab } from "../types";


export default function VendorDashboardPage() {
  // const {
  //   // vendor,
  //   // financialSummary,
  //   revenueTrend,
  //   // transactions,
  //   // bookingFilters,
  //   // bookings,
  //   // bookingsPagination,
  // } = vendorDashboardData;

  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<BookingFilterKey>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: summary } = useVendorSummary();
  const { data: transactions } = useVendorTransactions();
  const { data: bookingsData } = useVendorBookings(activeFilter, currentPage);

  const financialSummary = summary ? {
    currencySymbol: "₦",
    totalRevenue: summary.totalRevenue,
    // totalRevenueChangePercent: 12.4, // Mock % until we build historical diff query
    confirmedBookings: summary.confirmedBookings,
    // confirmedBookingsChangePercent: 8,
    pendingBookings: summary.pendingBookings,
    pendingBookingsNote: "Awaiting client confirmation",
  } : null;

  const bookingFilters: BookingFilterTab[] = [
    { key: "all", label: "All Bookings", count: bookingsData?.pagination.totalItems || 0 },
    { key: "upcoming", label: "Upcoming", count: 0 },
    { key: "completed", label: "Completed", count: 0 },
    { key: "cancelled", label: "Cancelled", count: 0 },
  ];

  const vendor = { 
    id: user?.id?.toString() || "", 
    name: user?.firstName || "Vendor", 
    firstName: user?.firstName || "Vendor", 
    avatarUrl: user?.avatarUrl || "/placeholder.jpg", 
    isFirstVisit: false, 
    unreadMessages: 0 
  } 

  const bookings = bookingsData?.bookings || [];

  const bookingsPagination = bookingsData?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 4 };

  return (
    <div className="min-h-screen bg-bg-primary">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 xl:block">
         <VendorSideNavBar /> 
      </aside>

      <div className="xl:pl-64">
        <VendorHeader vendor={vendor} />

        <main className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pb-28 pt-6 xs:px-6 md:gap-10 md:px-8 md:pb-12 md:pt-8">
          <DashboardHeading vendor={vendor} />

          {/* Animated Escrow Payout Notice */}
          {summary?.nextPayoutDate && (
            <div className="animate-fade-up rounded-card bg-accent-tint p-5 text-accent-primary shadow-card md:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-pulse">
                    <path d="M12 8V12L14 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold md:text-base">Escrow Payout Scheduled</p>
                  <p className="mt-0.5 text-xs text-accent-primary/80 md:text-sm">
                    Funds for <span className="font-bold">{summary.nextPayoutListing}</span> will be automatically disbursed to your bank account after the booked dates have elapsed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* <FinancialSummaryCards summary={financialSummary} /> */}
          {financialSummary && <FinancialSummaryCards summary={financialSummary} />}


          {/* addthis when there is revenue lg:grid-cols-5 */}
          <section className="grid grid-cols-1 gap-6 ">
            {/* <RevenueTrendChart trend={revenueTrend} /> */}
            <TransactionHistory transactions={transactions || []} />
          </section>

          <BookingsTable
            filters={bookingFilters}
            activeFilterKey={activeFilter}
            bookings={bookings}
            pagination={bookingsPagination}
            onFilterChange={(key) => { setActiveFilter(key); setCurrentPage(1); }}
            onPageChange={setCurrentPage}
          />
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 xl:hidden">
        <VendorMobileDock /> 
      </div>
    </div>
  );
}
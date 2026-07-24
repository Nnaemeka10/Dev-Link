// "use client";

// import React from "react";
// import VendorSideNavBar from "../../../components/layout/VendorSideNavBar";
// import VendorMobileDock from "../../../components/layout/VendorMobileDock";
// import { MOCK_VENDOR_DASHBOARD } from "../vendor.data";

// function formatNaira(amount: number) {
//   return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
// }

// function TodayContent() {
//   const { earnings, pendingRequests, upcomingBookings } = MOCK_VENDOR_DASHBOARD;

//   return (
//     <div className="max-w-5xl mx-auto py-8">
//       <div className="flex justify-between items-end mb-8">
//         <div>
//           <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Today</h1>
//           <p className="mt-2 text-sm text-text-primary/60">Here is your daily snapshot</p>
//         </div>
//       </div>

//       <div className="space-y-8">
//         {/* Earnings Overview */}
//         <section>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="p-6 rounded-3xl bg-white border border-text-primary/10 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
//               <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary/50 mb-2">Today&apos;s Earnings</h3>
//               <p className="text-3xl font-bold">{formatNaira(earnings.today)}</p>
//             </div>
//             <div className="p-6 rounded-3xl bg-white border border-text-primary/10 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
//               <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary/50 mb-2">30 Days Earnings</h3>
//               <p className="text-3xl font-bold">{formatNaira(earnings.thisMonth)}</p>
//             </div>
//             <div className="p-6 rounded-3xl bg-white border border-text-primary/10 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
//               <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary/50 mb-2">Pending Clearance</h3>
//               <p className="text-3xl font-bold">{formatNaira(earnings.pendingClearance)}</p>
//             </div>
//           </div>
//         </section>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Pending Requests */}
//           <section>
//             <h2 className="text-xl font-bold mb-4">Pending Requests ({pendingRequests.length})</h2>
//             <div className="bg-white rounded-4xl border border-text-primary/10 p-2 shadow-sm overflow-hidden flex flex-col gap-2">
//               {pendingRequests.length > 0 ? (
//                 pendingRequests.map((req) => (
//                   <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-gray-50 rounded-3xl transition-colors border border-transparent hover:border-gray-100">
//                     <div>
//                       <p className="font-bold text-lg">{req.guestName}</p>
//                       <p className="text-sm text-gray-500 mb-1">{req.listingName}</p>
//                       <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">{req.date}</p>
//                     </div>
//                     <div className="mt-4 sm:mt-0 flex gap-2 w-full sm:w-auto">
//                       <button className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-text-primary border font-semibold rounded-full hover:bg-gray-200">Decline</button>
//                       <button className="flex-1 sm:flex-none px-6 py-2 bg-accent-primary text-white font-bold rounded-full hover:brightness-95">Accept</button>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="py-12 text-center text-gray-500 text-sm">No pending requests right now.</div>
//               )}
//             </div>
//           </section>

//           {/* Upcoming Bookings */}
//           <section>
//             <h2 className="text-xl font-bold mb-4">Upcoming Bookings</h2>
//             <div className="bg-white rounded-4xl border border-text-primary/10 p-2 shadow-sm flex flex-col gap-2">
//               {upcomingBookings.length > 0 ? (
//                 upcomingBookings.map((req) => (
//                   <div key={req.id} className="flex gap-4 items-center p-4 hover:bg-gray-50 rounded-3xl transition-colors">
//                     <img src={req.guestAvatar} alt={req.guestName} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
//                     <div>
//                       <p className="font-bold text-md">{req.guestName}</p>
//                       <p className="text-xs text-gray-500">{req.listingName}</p>
//                       <p className="text-xs font-semibold text-text-primary mt-1">{req.date}</p>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="py-12 text-center text-gray-500 text-sm">You have no upcoming bookings.</div>
//               )}
//             </div>
//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }

// function MobileTodayView() {
//   return (
//     <section className="flex flex-col md:hidden min-h-screen bg-bg-primary pb-32">
//       <div className="px-4">
//         <TodayContent />
//       </div>
//       <VendorMobileDock />
//     </section>
//   );
// }

// function DesktopTodayView() {
//   return (
//     <section className="hidden xl:flex min-h-screen bg-bg-primary">
//       <VendorSideNavBar />
//       <div className="w-[85%] ml-[15%]">
//         <div className="px-10 lg:px-16">
//           <TodayContent />
//         </div>
//       </div>
//     </section>
//   );
// }

// function TabletTodayView() {
//   return (
//     <section className="hidden md:flex xl:hidden flex-col min-h-screen bg-bg-primary pb-32">
//       <div className="px-10">
//         <TodayContent />
//       </div>
//       <VendorMobileDock />
//     </section>
//   );
// }

// export default function TodayDashboard() {
//   return (
//     <main className="text-text-primary">
//       <MobileTodayView />
//       <TabletTodayView />
//       <DesktopTodayView />
//     </main>
//   );
// }

import { vendorDashboardData } from "./data";
import VendorHeader from "./components/VendorHeader";
import DashboardHeading from "./components/DashboardHeading";
import FinancialSummaryCards from "./components/FinancialSummaryCards";
import RevenueTrendChart from "./components/RevenueTrendChart";
import TransactionHistory from "./components/TransactionHistory";
import BookingsTable from "./components/BookingsTable";

// TODO(meks): swap for your DesktopSidebar / MobileDock imports, e.g.
// import DesktopSidebar from "@/components/navigation/DesktopSidebar";
// import MobileDock from "@/components/navigation/MobileDock";

export default function VendorDashboardPage() {
  const {
    vendor,
    financialSummary,
    revenueTrend,
    transactions,
    bookingFilters,
    bookings,
    bookingsPagination,
  } = vendorDashboardData;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ── Desktop sidebar slot ──────────────────────────────────────────
          Uses the project's three-breakpoint system: sidebar only from xl
          up. Swap this block for <DesktopSidebar /> — width should stay
          in sync with the `xl:pl-64` on the content wrapper below. */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 xl:block">
        {/* <DesktopSidebar /> */}
      </aside>

      <div className="xl:pl-64">
        <VendorHeader vendor={vendor} />

        <main className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pb-28 pt-6 xs:px-6 md:gap-10 md:px-8 md:pb-12 md:pt-8">
          <DashboardHeading vendor={vendor} />

          <FinancialSummaryCards summary={financialSummary} />

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <RevenueTrendChart trend={revenueTrend} />
            <TransactionHistory transactions={transactions} />
          </section>

          <BookingsTable
            filters={bookingFilters}
            bookings={bookings}
            pagination={bookingsPagination}
          />
        </main>
      </div>

      {/* ── Mobile / tablet dock slot ─────────────────────────────────────
          Shown below xl, matching the sidebar's breakpoint. Swap for
          <MobileDock />. Fixed to the viewport bottom; the `pb-28` on
          <main> above keeps content clear of it on small screens. */}
      <div className="fixed inset-x-0 bottom-0 z-50 xl:hidden">
        {/* <MobileDock /> */}
      </div>
    </div>
  );
}
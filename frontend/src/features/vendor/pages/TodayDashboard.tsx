import { vendorDashboardData } from "../data";
import VendorHeader from "../components/VendorHeader";
import DashboardHeading from "../components/DashboardHeading";
import FinancialSummaryCards from "../components/FinancialSummaryCards";
import RevenueTrendChart from "../components/RevenueTrendChart";
import TransactionHistory from "../components/TransactionHistory";
import BookingsTable from "../components/BookingsTable";
import VendorSideNavBar from "../../../components/layout/VendorSideNavBar";
import VendorMobileDock from "../../../components/layout/VendorMobileDock";


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
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 xl:block">
         <VendorSideNavBar /> 
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
      <div className="fixed inset-x-0 bottom-0 z-50 xl:hidden">
        <VendorMobileDock /> 
      </div>
    </div>
  );
}
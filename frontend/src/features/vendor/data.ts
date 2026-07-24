import type { VendorDashboardData } from "./types";

// ────────────────────────────────────────────────────────────────────────────
// Mock data — replace with a real fetch/React Query hook. Shapes match
// `VendorDashboardData` in `types.ts` so swapping the source is a no-op
// for every component in `components/`.
// ────────────────────────────────────────────────────────────────────────────

export const vendorDashboardData: VendorDashboardData = {
  vendor: {
    id: "vendor_2091",
    name: "Zainab Alake",
    firstName: "Zainab",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC_getXtpdhQ7LH_hxtFHK6mrg_b9ZUACcUHzb84WCFZM7HHUcRDfR9Mb9tEUfhks3lVnhxY8bYPzkRjfyhkNhcl5ZuZM8u-JboubNa4nQV_7EaxmDzjlhkA44w_v16zYV3xRoXtf5fwbx6XN6Amvse-djyxa-MLSGNyGw0kOqrNEB50vNo_1PL5x3MJDuQGFRbq7OPrlxQ4yZihnqZxz_NBXpN2i1TikzvY4QBuNvP4QTa4vJZyi3VtXdNCZnE3tsschDC6jpuRJQ",
    isFirstVisit: false,
    unreadMessages: 5,
  },

  financialSummary: {
    currencySymbol: "₦",
    totalRevenue: 8_450_200,
    totalRevenueChangePercent: 12.4,
    confirmedBookings: 24,
    confirmedBookingsChangePercent: 8,
    pendingBookings: 7,
    pendingBookingsNote: "Awaiting client confirmation",
  },

  revenueTrend: {
    rangeLabel: "Last 6 months",
    currentLabel: "2026 Revenue",
    previousLabel: "2025 Revenue",
    points: [
      { month: "Feb", currentPeriodValue: 620_000, previousPeriodValue: 410_000, currentPeriodHeightPct: 45, previousPeriodHeightPct: 30 },
      { month: "Mar", currentPeriodValue: 890_000, previousPeriodValue: 560_000, currentPeriodHeightPct: 60, previousPeriodHeightPct: 38 },
      { month: "Apr", currentPeriodValue: 740_000, previousPeriodValue: 690_000, currentPeriodHeightPct: 52, previousPeriodHeightPct: 47 },
      { month: "May", currentPeriodValue: 1_250_000, previousPeriodValue: 780_000, currentPeriodHeightPct: 85, previousPeriodHeightPct: 53 },
      { month: "Jun", currentPeriodValue: 980_000, previousPeriodValue: 820_000, currentPeriodHeightPct: 68, previousPeriodHeightPct: 56 },
      { month: "Jul", currentPeriodValue: 1_480_000, previousPeriodValue: 910_000, currentPeriodHeightPct: 100, previousPeriodHeightPct: 62 },
    ],
  },

  transactions: [
    {
      id: "txn_45920",
      title: "Eko Convention Center — Wedding Booking",
      referenceId: "#45920",
      date: "Jul 24, 2026",
      icon: "venue",
      status: "processing",
      direction: "credit",
      amount: 2_500_000,
    },
    {
      id: "txn_45915",
      title: "MC/DJ Bundle — Corporate Gala",
      referenceId: "#45915",
      date: "Jul 21, 2026",
      icon: "hosting",
      status: "completed",
      direction: "credit",
      amount: 450_000,
    },
    {
      id: "txn_45903",
      title: "Editorial Photography — Adewale & Chioma",
      referenceId: "#45903",
      date: "Jul 18, 2026",
      icon: "photography",
      status: "completed",
      direction: "credit",
      amount: 850_000,
    },
    {
      id: "txn_45882",
      title: "Bank Withdrawal (GTBank ...4920)",
      referenceId: "#45882",
      date: "Jul 15, 2026",
      icon: "withdrawal",
      status: "completed",
      direction: "debit",
      amount: 1_200_000,
    },
    {
      id: "txn_45861",
      title: "Set Design — Fashion Show",
      referenceId: "#45861",
      date: "Jul 10, 2026",
      icon: "design",
      status: "failed",
      direction: "credit",
      amount: 600_000,
    },
  ],

  bookingFilters: [
    { key: "all", label: "All Bookings", count: 32 },
    { key: "upcoming", label: "Upcoming", count: 12 },
    { key: "completed", label: "Completed", count: 17 },
    { key: "cancelled", label: "Cancelled", count: 3 },
  ],

  bookings: [
    {
      id: "bk_9021",
      bookingRef: "#BK-9021",
      clientName: "Adewale & Chioma",
      clientAvatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDafFGXXTfiQ_VJbWtneDbYQI-Z-bUBiSDb8YkzZMM94jpNCRME2r12IyTZCAj5hGT7o9MIyiHLS_nl8-TRLAulrG563cvxuneOvGK3xkPmgg8WwnEx3M5ya_WjRp26I_y1_D3v-huvD0uihO-We-3XIu0znBldKZpOWaQaSfjiZMnBMpe_tnf6DWMnOPvmgKD7jEJJFlaP58QbBmnmtKvEfhyKDKIr3VLq3hPa3YLR2tcsNztDHgxExPt0DzgK7MFL4IZkHtD6DE0",
      eventType: "Wedding",
      dateRange: { start: "Dec 15, 2026", end: "Dec 16, 2026" },
      time: "10:00 AM",
      listing: { type: "venue", name: "Lagos Oriental Hotel", label: "Editorial Photography" },
      totalPrice: 850_000,
      status: "confirmed",
    },
    {
      id: "bk_9045",
      bookingRef: "#BK-9045",
      clientName: "Bode Thomas",
      clientAvatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAWCMUWns_JNqDcyq4XSDQEqDIfyjEd915qdg0VIuRjChIZw1IICtLSHaEt1SE37k5RZguNMJ6dDGkemUf_oQ1XOlyOcD8fYQ9vmgg3_F_8XiluKSzfExVc_MsLhLJDdq-qXUZtKfhQD8CWrY_RmA8mU5MijP9hwEf88eg8CeOuhQfRD9TNK_87qSUzjvdny8tOJLMiJBOtx8RQ-tBN_kys4-UZGjoYU1BQmiS1l4eamrU4jsmL22zXg5HhnaTjkYxfIniNENC5-Z4",
      eventType: "Corporate Gala",
      dateRange: { start: "Nov 28, 2026", end: null },
      time: "6:00 PM",
      listing: { type: "service", name: "Eko Hotels & Suites", label: "Event Hosting / MC" },
      totalPrice: 1_200_000,
      status: "pending",
    },
    {
      id: "bk_8890",
      bookingRef: "#BK-8890",
      clientName: "Tunde Oshin",
      clientAvatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDcdpONrNq743IjPD2z7aF3dDbsIuxd8asjhMKwDvg_tOvCpp_KniUHP9mu-T0ZzgTtalp69AdRS_u2TAEIPQTJ0hHic-3Tq_r6ry-xv0rV2ZC-E-f1xEPfmasukUsj6IcrvAxY6sE-LR5UlOTZWZynOkRq0H2qvWoXFpFfUnmHzZW3X2E_UN-OPrmY3dQmwQiN6OML_FGiMCQU2p2oBV6RHxvT-ATbfKdwx_YdzvQXMtawqSZU9w0OpPCUXBvzcGiwdzbWG00dyUo",
      eventType: "Conference",
      dateRange: { start: "Oct 12, 2026", end: "Oct 13, 2026" },
      time: "09:00 AM",
      listing: { type: "service", name: "Civic Centre, VI", label: "Sound Engineering" },
      totalPrice: 450_000,
      status: "completed",
    },
    {
      id: "bk_8722",
      bookingRef: "#BK-8722",
      clientName: "Yemisi Odunlami",
      clientAvatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCDH47avUGQTmPhJS-PbPddB2Y0CmWlzBR72cnSl00L28agJBTNjDH_NPP4YGfSc756q7AnO1PYgXBLkzMK9Ul_2NfZcSUm_YpBC5BvLhZ6MHdvzWKrVbFZNKIDyPWPbO1n-SCiAjMzhNJrUvYq6zlVcP_g5c_um6dxvHbFdZayWE_nCD4Cp3gLJQsiTdiee1KbxY4Khj6Mflk8IeZPhDFU-iXvZ9N4nTuTWrScgkmtcWBhkx9ogqHEcdJMky3mHhx7dVpb1_PLWLg",
      eventType: "Fashion Show",
      dateRange: { start: "Jan 05, 2027", end: null },
      time: "2:00 PM",
      listing: { type: "venue", name: "Landmark Events Centre", label: "Set Design" },
      totalPrice: 600_000,
      status: "cancelled",
    },
  ],

  bookingsPagination: {
    currentPage: 1,
    totalPages: 8,
    totalItems: 32,
    itemsPerPage: 4,
  },
};
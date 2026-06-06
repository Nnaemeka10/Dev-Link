import { VendorDashboardData, VendorListing } from "./vendor.types";

export const MOCK_VENDOR_DASHBOARD: VendorDashboardData = {
  earnings: {
    today: 250000,
    thisMonth: 4500000,
    pendingClearance: 750000,
  },
  upcomingBookings: [
    {
      id: "req_1",
      guestName: "Chuka Obi",
      guestAvatar: "https://i.pravatar.cc/150?u=chuka",
      listingName: "The Grand Onyx Pavilion",
      date: "2026-05-27",
      status: "approved",
      amount: 1500000,
    },
    {
      id: "req_2",
      guestName: "Aisha Bello",
      guestAvatar: "https://i.pravatar.cc/150?u=aisha",
      listingName: "DJ Spinall Setup",
      date: "2026-05-28",
      status: "approved",
      amount: 450000,
    },
  ],
  pendingRequests: [
    {
      id: "req_3",
      guestName: "Samuel Jackson",
      listingName: "The Grand Onyx Pavilion",
      date: "2026-06-15",
      status: "pending",
      amount: 2500000,
    },
  ],
};

export const MOCK_VENDOR_LISTINGS: VendorListing[] = [
  {
    id: "list_1",
    title: "The Grand Onyx Pavilion",
    location: "Victoria Island, Lagos",
    status: "active",
    pricePerUnit: 2500000,
    unit: "day",
    thumbnailUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    viewsLast30Days: 1240,
    bookingsLast30Days: 4,
  },
  {
    id: "list_2",
    title: "DJ Spinall Premium Set",
    location: "Lagos, NG",
    status: "active",
    pricePerUnit: 450000,
    unit: "event",
    thumbnailUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
    viewsLast30Days: 856,
    bookingsLast30Days: 7,
  },
  {
    id: "list_3",
    title: "Civic Center Glass House - Annex",
    location: "Ikoyi, Lagos",
    status: "draft",
    pricePerUnit: 1800000,
    unit: "day",
    thumbnailUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
    viewsLast30Days: 0,
    bookingsLast30Days: 0,
  },
];

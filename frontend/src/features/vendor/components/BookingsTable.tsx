import Image from "next/image";
import type { BookingFilterTab, BookingRecord, PaginationState } from "../types";
import { formatCurrency } from "../utils";
import BookingStatusPill from "./BookingStatusPill";

interface BookingsTableProps {
  filters: BookingFilterTab[];
  activeFilterKey?: BookingFilterTab["key"];
  bookings: BookingRecord[];
  pagination: PaginationState;
}

function formatDateRange(dateRange: BookingRecord["dateRange"]) {
  if (dateRange.end) return `${dateRange.start} – ${dateRange.end}`;
  return dateRange.start;
}

export default function BookingsTable({
  filters,
  activeFilterKey = "all",
  bookings,
  pagination,
}: BookingsTableProps) {
  const rangeStart = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const rangeEnd = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

  return (
    <section className="animate-fade-up overflow-hidden rounded-card border border-black/5 bg-white shadow-card">
      {/* Filter bar */}
      <div className="flex flex-col gap-4 border-b border-black/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex flex-wrap gap-1 rounded-full bg-bg-tertiary p-1">
          {filters.map((tab) => {
            const isActive = tab.key === activeFilterKey;
            return (
              <button
                key={tab.key}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 xs:px-5 ${
                  isActive
                    ? "bg-white text-accent-primary shadow-card"
                    : "text-text-primary/55 hover:bg-white/60 hover:text-text-primary"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs font-medium text-text-primary/40">{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-text-primary/60 transition-all duration-300 hover:border-accent-primary/30 hover:bg-bg-tertiary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6H20L14 13V19L10 21V13L4 6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
            Filters
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-text-primary/60 transition-all duration-300 hover:border-accent-primary/30 hover:bg-bg-tertiary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 8H18M8 12H16M10 16H14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            Sort: Newest
          </button>
        </div>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-bg-tertiary/40">
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-text-primary/45">
                Client Name
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-primary/45">
                Event Type
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-primary/45">
                Date &amp; Time
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-primary/45">
                Venue / Service
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-primary/45">
                Total Price
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-primary/45">
                Status
              </th>
              <th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-widest text-text-primary/45">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {bookings.map((booking, index) => {
              const isCancelled = booking.status === "cancelled";
              return (
                <tr
                  key={booking.id}
                  className="group transition-all duration-300 hover:-translate-y-0.5 hover:bg-bg-tertiary/50 hover:shadow-card"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-black/10 transition-transform duration-500 group-hover:scale-110">
                        <Image
                          src={booking.clientAvatarUrl}
                          alt={booking.clientName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-text-primary transition-colors group-hover:text-accent-primary">
                          {booking.clientName}
                        </p>
                        <p className="text-xs text-text-primary/45">{booking.bookingRef}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-sm font-medium text-text-primary">{booking.eventType}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className={`text-sm ${isCancelled ? "opacity-60" : ""}`}>
                      <p className={`font-semibold text-text-primary ${isCancelled ? "line-through" : ""}`}>
                        {formatDateRange(booking.dateRange)}
                      </p>
                      <p className="text-xs text-text-primary/45">{booking.time}</p>
                    </div>
                  </td>
                  <td className={`px-6 py-6 ${isCancelled ? "opacity-60" : ""}`}>
                    <div className="text-sm">
                      <p className="font-medium text-text-primary">{booking.listing.name}</p>
                      <p className="text-xs font-bold text-accent-primary">{booking.listing.label}</p>
                    </div>
                  </td>
                  <td className={`px-6 py-6 ${isCancelled ? "opacity-60" : ""}`}>
                    <p className="font-bold text-text-primary">{formatCurrency(booking.totalPrice)}</p>
                  </td>
                  <td className="px-6 py-6">
                    <BookingStatusPill status={booking.status} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        title="Chat with client"
                        className="rounded-full p-2 text-text-primary/50 transition-all duration-300 hover:scale-110 hover:bg-bg-tertiary hover:text-accent-primary"
                      >
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M4 5.5C4 4.67157 4.67157 4 5.5 4H18.5C19.3284 4 20 4.67157 20 5.5V15.5C20 16.3284 19.3284 17 18.5 17H8L4 20.5V5.5Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-bg-tertiary px-4 py-2 text-xs font-bold text-text-primary shadow-card transition-all duration-300 hover:scale-105 hover:bg-accent-primary hover:text-white active:scale-95"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <ul className="divide-y divide-black/5 md:hidden">
        {bookings.map((booking) => {
          const isCancelled = booking.status === "cancelled";
          return (
            <li key={booking.id} className="p-5 xs:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-black/10">
                    <Image
                      src={booking.clientAvatarUrl}
                      alt={booking.clientName}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{booking.clientName}</p>
                    <p className="text-xs text-text-primary/45">{booking.bookingRef}</p>
                  </div>
                </div>
                <BookingStatusPill status={booking.status} />
              </div>

              <div className={`mt-4 grid grid-cols-2 gap-3 text-sm ${isCancelled ? "opacity-60" : ""}`}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-primary/40">
                    Event
                  </p>
                  <p className="mt-0.5 font-medium text-text-primary">{booking.eventType}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-primary/40">
                    Total
                  </p>
                  <p className="mt-0.5 font-bold text-text-primary">{formatCurrency(booking.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-primary/40">
                    Date &amp; Time
                  </p>
                  <p className={`mt-0.5 font-medium text-text-primary ${isCancelled ? "line-through" : ""}`}>
                    {formatDateRange(booking.dateRange)}
                  </p>
                  <p className="text-xs text-text-primary/45">{booking.time}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-primary/40">
                    Venue / Service
                  </p>
                  <p className="mt-0.5 font-medium text-text-primary">{booking.listing.name}</p>
                  <p className="text-xs font-bold text-accent-primary">{booking.listing.label}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-bg-tertiary px-4 py-2.5 text-xs font-bold text-text-primary active:scale-95"
                >
                  View Details
                </button>
                <button
                  type="button"
                  title="Chat with client"
                  className="rounded-full border border-black/10 p-2.5 text-text-primary/50 active:scale-90"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 5.5C4 4.67157 4.67157 4 5.5 4H18.5C19.3284 4 20 4.67157 20 5.5V15.5C20 16.3284 19.3284 17 18.5 17H8L4 20.5V5.5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-black/5 bg-bg-tertiary/40 px-5 py-6 xs:flex-row md:px-8">
        <p className="text-sm font-medium text-text-primary/55">
          Showing {rangeStart}-{rangeEnd} of {pagination.totalItems} bookings
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous page"
            disabled={pagination.currentPage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary/40 transition-all duration-300 hover:scale-110 hover:bg-bg-tertiary disabled:pointer-events-none disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {Array.from({ length: Math.min(pagination.totalPages, 3) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              aria-current={page === pagination.currentPage ? "page" : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 hover:scale-110 ${
                page === pagination.currentPage
                  ? "bg-accent-primary text-white"
                  : "text-text-primary/60 hover:bg-bg-tertiary"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            aria-label="Next page"
            disabled={pagination.currentPage === pagination.totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary/40 transition-all duration-300 hover:scale-110 hover:bg-bg-tertiary disabled:pointer-events-none disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
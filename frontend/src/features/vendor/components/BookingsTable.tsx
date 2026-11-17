"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, CheckCircle2, ChevronRight, Inbox, XCircle } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import type {
  BookingFilterKey,
  BookingFilterTab,
  BookingRecord,
  BookingSortKey,
  PaginationState,
} from "../types";
import BookingStatusPill from "./BookingStatusPill";
import VendorPagination from "./VendorPagination";
import { EASE_OUT, VENDOR_CARD, initialsOf } from "../utils";

/** Concise trigger labels; the full phrasing lives in the popover. */
const SORT_LABELS: Record<BookingSortKey, string> = {
  newest: "Newest",
  oldest: "Oldest",
  event_soonest: "Event date",
  amount_desc: "Price: high → low",
  amount_asc: "Price: low → high",
};

const SORT_DESCRIPTIONS: Record<BookingSortKey, string> = {
  newest: "Most recently booked first",
  oldest: "Earliest bookings first",
  event_soonest: "Soonest event date first",
  amount_desc: "Highest booking value first",
  amount_asc: "Lowest booking value first",
};

const SORT_ORDER: BookingSortKey[] = [
  "newest",
  "oldest",
  "event_soonest",
  "amount_desc",
  "amount_asc",
];

const EMPTY_COPY: Record<
  BookingFilterKey,
  { icon: React.ElementType; title: string; body: string }
> = {
  pending: {
    icon: Inbox,
    title: "Nothing awaiting confirmation",
    body: "Paid bookings appear here the moment a customer pays. Confirm within 24 hours to keep them.",
  },
  upcoming: {
    icon: CalendarClock,
    title: "No upcoming events",
    body: "Confirmed bookings with a future event date will show up here.",
  },
  completed: {
    icon: CheckCircle2,
    title: "No completed events yet",
    body: "Once an event wraps and the payout settles, it moves here.",
  },
  cancelled: {
    icon: XCircle,
    title: "Nothing cancelled",
    body: "Declined, cancelled and refunded bookings are kept here for your records.",
  },
};

interface BookingsTableProps {
  filters: BookingFilterTab[];
  activeFilterKey: BookingFilterKey;
  sort: BookingSortKey;
  bookings: BookingRecord[];
  pagination: PaginationState;
  isLoading?: boolean;
  onFilterChange: (key: BookingFilterKey) => void;
  onSortChange: (key: BookingSortKey) => void;
  onPageChange: (page: number) => void;
  onConfirmBooking: (bookingId: string) => void;
  confirmingBookingId?: string | null;
}

function ClientAvatar({ booking }: { booking: BookingRecord }) {
  if (booking.clientAvatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars may be Google-hosted; plain img avoids remote-pattern failures
      <img
        src={booking.clientAvatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-[#F0E9DF]"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7D1C8] text-xs font-extrabold text-[#B9401D]"
    >
      {initialsOf(booking.clientName)}
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#F0E9DF] bg-white p-4">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#EFE7DE]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#EFE7DE]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#EFE7DE]" />
      </div>
      <div className="h-6 w-20 animate-pulse rounded-full bg-[#EFE7DE]" />
    </div>
  );
}

/**
 * Deliberately minimal: who booked, what they booked, where it stands, and the
 * one action that matters. Everything else lives on the booking detail page.
 */
function BookingRow({
  booking,
  index,
  onConfirm,
  isConfirming,
}: {
  booking: BookingRecord;
  index: number;
  onConfirm: (id: string) => void;
  isConfirming: boolean;
}) {
  const router = useRouter();
  const canConfirm = booking.status === "paid" || booking.status === "funds_held";
  const href = `/vendor/bookings/${booking.id}`;
  const open = () => router.push(href);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24), ease: EASE_OUT }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        }}
        aria-label={`Open booking ${booking.bookingRef} for ${booking.clientName}`}
        className="group cursor-pointer rounded-2xl border border-[#F0E9DF] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#B9401D]/25 hover:shadow-[0_14px_30px_rgba(36,28,18,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9401D]"
      >
        <div className="flex items-center gap-3">
          <ClientAvatar booking={booking} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-[#252423] transition-colors group-hover:text-[#B9401D]">
              {booking.clientName}
            </p>
            <p className="mt-0.5 truncate text-tiny font-semibold text-[#9A9AAE]">
              {booking.listing.name}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <BookingStatusPill status={booking.status} />
            <ChevronRight
              className="hidden h-4 w-4 text-[#C4BBAE] transition-transform group-hover:translate-x-0.5 group-hover:text-[#B9401D] sm:block"
              aria-hidden="true"
            />
          </div>
        </div>

        {canConfirm && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onConfirm(booking.id);
            }}
            disabled={isConfirming}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#B9401D] px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
          >
            {isConfirming ? (
              <>
                Confirming
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              </>
            ) : (
              "Confirm booking"
            )}
          </button>
        )}
      </div>
    </motion.li>
  );
}

export default function BookingsTable({
  filters,
  activeFilterKey,
  sort,
  bookings,
  pagination,
  isLoading = false,
  onFilterChange,
  onSortChange,
  onPageChange,
  onConfirmBooking,
  confirmingBookingId,
}: BookingsTableProps) {
  const filterOptions: DropdownOption<BookingFilterKey>[] = filters.map((tab) => ({
    value: tab.key,
    label: tab.label,
    description: `${tab.count} booking${tab.count === 1 ? "" : "s"}`,
  }));

  const sortOptions: DropdownOption<BookingSortKey>[] = SORT_ORDER.map((key) => ({
    value: key,
    label: SORT_LABELS[key],
    description: SORT_DESCRIPTIONS[key],
  }));

  const empty = EMPTY_COPY[activeFilterKey];
  const EmptyIcon = empty.icon;

  return (
    <section className={`${VENDOR_CARD} overflow-hidden`}>
      {/*  Controls  */}
      <div className="border-b border-[#F0E9DF] p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
              Bookings
            </h2>
            <p className="mt-0.5 text-tiny font-semibold text-[#9A9AAE]">
              Tap a booking for full details and actions
            </p>
          </div>
        </div>

        {/* Mobile: labelled Filter + Sort dropdowns replace the tab strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
          <Dropdown<BookingFilterKey>
            label="Filter"
            options={filterOptions}
            value={activeFilterKey}
            onChange={onFilterChange}
            size="md"
            width="content"
            aria-label="Filter bookings"
          />
          <Dropdown<BookingSortKey>
            label="Sort by"
            options={sortOptions}
            value={sort}
            onChange={onSortChange}
            size="md"
            align="right"
            width="content"
            aria-label="Sort bookings"
          />
        </div>

        {/* Desktop: tabs + sort. No redundant Filters button. */}
        <div className="mt-4 hidden items-center justify-between gap-4 md:flex">
          <div
            role="tablist"
            aria-label="Booking status"
            className="flex flex-wrap items-center gap-1 rounded-full bg-[#F4F1EA] p-1"
          >
            {filters.map((tab) => {
              const isActive = tab.key === activeFilterKey;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onFilterChange(tab.key)}
                  className={`relative rounded-full px-4 py-2 text-xs font-extrabold transition-colors lg:px-5 ${
                    isActive ? "text-white" : "text-[#6B5F57] hover:text-[#252423]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="vendor-booking-tab"
                      className="absolute inset-0 rounded-full bg-[#252423]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`relative z-10 ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      isActive ? "bg-white/20" : "bg-white"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <Dropdown<BookingSortKey>
            label="Sort by"
            options={sortOptions}
            value={sort}
            onChange={onSortChange}
            size="md"
            align="right"
            width="content"
            className="w-52 shrink-0"
            aria-label="Sort bookings"
          />
        </div>
      </div>

      {/*  Cards - identical minimal shape on every breakpoint  */}
      <div className="p-4 md:p-6">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="flex flex-col items-center rounded-2xl border border-dashed border-[#E0D5C7] bg-[#FDFBF7] px-6 py-14 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
              <EmptyIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-sm font-extrabold text-[#252423]">{empty.title}</h3>
            <p className="mt-1 max-w-sm text-tiny font-semibold leading-5 text-[#9A9AAE]">
              {empty.body}
            </p>
          </motion.div>
        ) : (
          <motion.ul layout className="grid gap-3 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {bookings.map((booking, index) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  index={index}
                  onConfirm={onConfirmBooking}
                  isConfirming={confirmingBookingId === booking.id}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      {/*  Pagination  */}
      <div className="border-t border-[#F0E9DF] bg-[#FDFBF7] px-4 py-4 md:px-6">
        <VendorPagination
          pagination={pagination}
          onPageChange={onPageChange}
          itemLabel="bookings"
          layoutId="vendor-bookings-pagination"
        />
      </div>
    </section>
  );
}
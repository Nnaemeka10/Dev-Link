"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { useMyBookings } from "../hooks/useSavedHub";
import BookingCard, { type BookingActionType } from "./BookingCard";
import BookingDetailsModal from "./BookingDetailsModal";
import RefundModal from "./RefundModal";
import ReviewModal from "./ReviewModal";
import ComplaintModal from "./ComplaintModal";
import ReceiptModal from "./ReceiptModal";
import type { BookingBucket, KindFilter, MyBookingItem } from "../saved.types";

const BUCKETS: { key: BookingBucket; label: string; icon: React.ElementType }[] = [
  { key: "upcoming", label: "Upcoming", icon: CalendarClock },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "cancelled", label: "Cancelled", icon: XCircle },
];

const KIND_FILTERS: { key: KindFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "halls", label: "Halls" },
  { key: "services", label: "Services" },
];

type ModalState = { type: BookingActionType; booking: MyBookingItem } | null;

export default function BookingsPanel() {
  const router = useRouter();
  const [bucket, setBucket] = useState<BookingBucket>("upcoming");
  const [kind, setKind] = useState<KindFilter>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const { data, isLoading } = useMyBookings();

  const bookings = useMemo(() => data?.bookings ?? [], [data]);
  const bucketCounts = useMemo(
    () => ({
      upcoming: bookings.filter((b) => b.bucket === "upcoming").length,
      completed: bookings.filter((b) => b.bucket === "completed").length,
      cancelled: bookings.filter((b) => b.bucket === "cancelled").length,
    }),
    [bookings]
  );
  const filtered = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.bucket === bucket &&
          (kind === "all" || (kind === "halls" ? b.kind === "hall" : b.kind === "service"))
      ),
    [bookings, bucket, kind]
  );

  function handleAction(type: BookingActionType, booking: MyBookingItem) {
    if (type === "chat") {
      router.push("/messages");
      return;
    }
    if (type === "rebook") {
      router.push(`/listings/${booking.kind === "hall" ? "halls" : "services"}/${booking.listingId}`);
      return;
    }
    setModal({ type, booking });
  }

  const close = () => setModal(null);

  return (
    <div>
      {/* Bucket tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {BUCKETS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setBucket(key)}
            className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold transition-colors ${
              bucket === key ? "text-white" : "text-[#6B5F57] hover:text-[#252423]"
            }`}
          >
            {bucket === key && (
              <motion.span
                layoutId="booking-bucket-pill"
                className="absolute inset-0 rounded-full bg-[#252423]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">{label}</span>
            <span
              className={`relative z-10 rounded-full px-1.5 py-0.5 text-[10px] ${
                bucket === key ? "bg-white/20" : "bg-[#F0E9DF]"
              }`}
            >
              {bucketCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Kind filter */}
      <div className="mt-4 inline-flex rounded-full bg-[#F0E9DF] p-1">
        {KIND_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setKind(key)}
            className={`relative rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-colors ${
              kind === key ? "text-white" : "text-[#6B5F57] hover:text-[#252423]"
            }`}
          >
            {kind === key && (
              <motion.span
                layoutId="booking-kind-pill"
                className="absolute inset-0 rounded-full bg-[#B9401D]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-[2rem] border border-dashed border-[#E0D5C7] bg-white/60 px-6 py-16 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
              <CalendarClock className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-extrabold text-[#252423]">No {bucket} bookings</h3>
            <p className="mt-1 max-w-xs text-sm font-semibold text-[#9A9AAE]">
              {bucket === "upcoming"
                ? "Your confirmed and pending bookings will appear here."
                : bucket === "completed"
                  ? "Finished events show up here once they wrap."
                  : "Cancelled and refunded bookings are kept here for your records."}
            </p>
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-5 lg:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((booking, i) => (
                <BookingCard key={booking.id} booking={booking} index={i} onAction={handleAction} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Action modals */}
      {modal && (
        <>
          <BookingDetailsModal
            isOpen={modal.type === "details"}
            bookingId={modal.booking.id}
            onClose={close}
            onAction={(type) => setModal({ type, booking: modal.booking })}
          />
          <RefundModal
            isOpen={modal.type === "refund"}
            booking={modal.booking}
            onClose={close}
          />
          <ReviewModal
            isOpen={modal.type === "review"}
            booking={modal.booking}
            onClose={close}
          />
          <ComplaintModal
            isOpen={modal.type === "complaint"}
            booking={modal.booking}
            onClose={close}
          />
          <ReceiptModal
            isOpen={modal.type === "receipt"}
            booking={modal.booking}
            onClose={close}
          />
        </>
      )}
    </div>
  );
}
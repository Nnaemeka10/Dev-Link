"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Ban,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  CloudOff,
  Copy,
  Hash,
  Info,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Printer,
  RotateCcw,
  ShieldCheck,
  StickyNote,
  Undo2,
  UsersRound,
  Wallet,
} from "lucide-react";
import VendorPageShell from "../components/VendorPageShell";
import BookingStatusPill from "../components/BookingStatusPill";
import DeclineBookingModal from "../components/DeclineBookingModal";
import { useConfirmBooking, useVendorBooking } from "../hooks/useVendorDashboard";
import { ApiError } from "@/lib/api";
import type { BookingDetail } from "../types";
import {
  EASE_OUT,
  VENDOR_CARD,
  bookedSpans,
  countBookedDays,
  formatDay,
  formatDayShort,
  formatTimestamp,
  initialsOf,
  naira,
  spanLabel,
} from "../utils";

const CONFIRM_WINDOW_HOURS = 24;

/**
 * Live "time left to confirm" against the 24h auto-refund job. Ticks once a
 * minute - enough resolution for an hour-scale deadline without burning
 * renders. Only runs while the booking actually awaits a decision.
 */
function useDecisionDeadline(paidAt: string | null, active: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!active || !paidAt) return null;
  const deadline = new Date(paidAt).getTime() + CONFIRM_WINDOW_HOURS * 3_600_000;
  const msLeft = deadline - now;
  if (msLeft <= 0) return { expired: true, label: "Auto-refund is due - confirm now" };
  const hours = Math.floor(msLeft / 3_600_000);
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000);
  return {
    expired: false,
    label:
      hours > 0
        ? `${hours}h ${minutes}m left to confirm`
        : `${minutes}m left to confirm`,
  };
}

function DetailRow({
  icon: Icon,
  label,
  value,
  wide,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-bold leading-snug text-[#252423]">{value}</p>
      </div>
    </div>
  );
}

function ClientAvatar({ booking, size = 56 }: { booking: BookingDetail; size?: number }) {
  const dimension = { width: size, height: size };
  if (booking.client.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars may be Google-hosted
      <img
        src={booking.client.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        style={dimension}
        className="shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={dimension}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#F7D1C8] text-sm font-extrabold text-[#B9401D] ring-2 ring-white"
    >
      {initialsOf(booking.client.name)}
    </span>
  );
}

export default function VendorBookingDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const { data: booking, isLoading, isError, refetch } = useVendorBooking(id || null);
  const confirmMutation = useConfirmBooking();

  const [declineOpen, setDeclineOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [soon, setSoon] = useState<string | null>(null);
  const soonTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(soonTimer.current), []);

  const awaiting = !!booking && (booking.status === "paid" || booking.status === "funds_held");
  const deadline = useDecisionDeadline(booking?.paidAt ?? null, awaiting);

  function showSoon(message: string) {
    setSoon(message);
    window.clearTimeout(soonTimer.current);
    soonTimer.current = window.setTimeout(() => setSoon(null), 2800);
  }

  async function copyReference() {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(booking.bookingRef);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 1800);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }

  if (isLoading) {
    return (
      <VendorPageShell width="narrow" back={{ href: "/vendor", label: "Back to bookings" }}>
        <div className="space-y-4">
          <div className="h-52 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
          <div className="h-44 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
          <div className="h-64 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
        </div>
      </VendorPageShell>
    );
  }

  if (isError || !booking) {
    return (
      <VendorPageShell width="narrow" back={{ href: "/vendor", label: "Back to bookings" }}>
        <div className={`${VENDOR_CARD} flex flex-col items-center px-6 py-16 text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
            <CloudOff className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold text-[#252423]">Booking not found</h1>
          <p className="mt-1.5 max-w-sm text-sm font-semibold text-[#9A9AAE]">
            This booking may not belong to one of your listings, or the link is out of
            date.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-2 rounded-full border border-[#E8DDD2] px-6 py-2.5 text-xs font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </button>
            <Link
              href="/vendor"
              className="rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white transition-all hover:brightness-95"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </VendorPageShell>
    );
  }

  const isService = booking.kind === "service";
  const spans = bookedSpans(
    booking.dateRange.start,
    booking.dateRange.end,
    booking.excludedDates
  );
  const dayCount = countBookedDays(spans);
  const confirmError =
    confirmMutation.error instanceof ApiError
      ? confirmMutation.error.message
      : confirmMutation.error
        ? "We couldn't confirm this booking. Please try again."
        : null;

  const payoutLabel = booking.payout
    ? booking.payout.status === "succeeded"
      ? "Paid out"
      : "Transfer in flight"
    : booking.payoutHold
      ? "On hold"
      : booking.disputeWindowClosesAt
        ? `Scheduled for ${formatDay(booking.disputeWindowClosesAt)}`
        : "Awaiting event completion";

  return (
    <VendorPageShell width="narrow" back={{ href: "/vendor", label: "Back to bookings" }}>
      {/*  Identity + decision  */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: EASE_OUT }}
        className={`${VENDOR_CARD} overflow-hidden`}
      >
        <div
          aria-hidden="true"
          className={`h-1.5 w-full ${
            awaiting
              ? "bg-linear-to-r from-[#C9993A] to-[#B9401D]"
              : "bg-linear-to-r from-[#2D5A27] via-[#C9993A] to-[#B9401D]"
          }`}
        />
        <div className="p-5 md:p-7">
          <div className="flex items-start gap-4">
            <ClientAvatar booking={booking} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-man text-lg font-extrabold text-[#252423] md:text-2xl">
                  {booking.client.name}
                </h1>
                <BookingStatusPill status={booking.status} size="md" />
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-[#5E6588]">
                {booking.listing.name}
              </p>
              <button
                type="button"
                onClick={copyReference}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#F7F2EA] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#6B5F57] transition-colors hover:text-[#B9401D]"
              >
                {copiedRef ? (
                  <Check className="h-3 w-3 text-[#2D5A27]" aria-hidden="true" />
                ) : (
                  <Copy className="h-3 w-3" aria-hidden="true" />
                )}
                {copiedRef ? "Copied" : booking.bookingRef}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <DetailRow
              icon={CalendarDays}
              label={`Event dates · ${dayCount} ${dayCount === 1 ? "day" : "days"}`}
              value={spans.map(spanLabel).join(" · ") || "-"}
              wide
            />
            <DetailRow icon={Clock} label="Time (24h)" value={booking.time} />
            <DetailRow
              icon={MapPin}
              label={isService ? "Event location" : "Venue address"}
              value={booking.location ?? "Not provided"}
            />
          </div>

          {/* Decision bar */}
          <AnimatePresence initial={false}>
            {awaiting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="overflow-hidden"
              >
                <div className="mt-5 rounded-2xl bg-[#FFF7F2] p-4">
                  {deadline && (
                    <p
                      className={`flex items-center gap-2 text-tiny font-extrabold ${
                        deadline.expired ? "text-red-600" : "text-[#8A5A44]"
                      }`}
                    >
                      <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {deadline.label}
                    </p>
                  )}
                  <p className="mt-1.5 text-tiny font-semibold leading-5 text-[#8A5A44]">
                    The customer has paid and the money is in escrow. Confirm to lock in
                    the event, or decline to refund them in full.
                  </p>
                  <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => confirmMutation.mutate(booking.id)}
                      disabled={confirmMutation.isPending}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#B9401D] px-6 py-3.5 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {confirmMutation.isPending ? (
                        <>
                          Confirming
                          <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                            aria-hidden="true"
                          />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Confirm booking
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeclineOpen(true)}
                      disabled={confirmMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-6 py-3.5 text-sm font-extrabold text-red-600 transition-colors hover:bg-red-50 active:scale-[0.99] disabled:opacity-50"
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                      Decline
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {confirmError && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {confirmError}
            </p>
          )}

          {confirmMutation.isSuccess && !awaiting && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2 rounded-2xl bg-[#F1F7F2] px-4 py-3 text-sm font-semibold text-[#2D5A27]"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Booking confirmed. The customer has been emailed and your payout is
              scheduled.
            </motion.p>
          )}
        </div>
      </motion.section>

      {/*  Earnings  */}
      <section className={`${VENDOR_CARD} p-5 md:p-7`}>
        <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
          What you&apos;ll receive
        </h2>
        <p className="mt-3 font-man text-3xl font-black tabular-nums tracking-tight text-[#2D5A27]">
          {naira(booking.money.vendorNet)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-tiny font-bold text-[#9A9AAE]">
          <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
          {payoutLabel}
        </p>

        <div className="mt-5 space-y-2.5 border-t border-[#F0E9DF] pt-4">
          <div className="flex justify-between gap-4 text-sm font-semibold text-[#5E6588]">
            <span>Customer paid (incl. VAT)</span>
            <span className="tabular-nums text-[#252423]">{naira(booking.money.total)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm font-semibold text-[#5E6588]">
            <span>Listing subtotal</span>
            <span className="tabular-nums text-[#252423]">{naira(booking.money.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm font-semibold text-[#5E6588]">
            <span>VAT (7.5%) - remitted to tax authority</span>
            <span className="tabular-nums text-[#9A9AAE]">{naira(booking.money.vat)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm font-semibold text-[#5E6588]">
            <span>EventVnV commission (10%)</span>
            <span className="tabular-nums text-[#B9401D]">
              − {naira(booking.money.commission)}
            </span>
          </div>
        </div>

        {booking.payoutHold && (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-[#FDF1EC] px-4 py-3 text-tiny font-semibold leading-5 text-[#8A3A1C]">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            This payout is on hold while support resolves a dispute or refund. You&apos;ll
            be notified once it clears.
          </p>
        )}
      </section>

      {/*  Event specifics  */}
      <section className={`${VENDOR_CARD} p-5 md:p-7`}>
        <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
          Event details
        </h2>

        <div className="mt-4 space-y-2.5">
          {spans.map((span, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#F0E9DF] px-4 py-3"
            >
              <span className="flex items-center gap-2.5 text-sm font-bold text-[#252423]">
                <CalendarDays className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
                {spanLabel(span)}
              </span>
              <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-[#9A9AAE]">
                {span.from.getTime() === span.to.getTime() ? "Single day" : "Range"}
              </span>
            </div>
          ))}
        </div>

        {booking.excludedDates.length > 0 && (
          <div className="mt-3 rounded-2xl bg-[#F7F2EA] px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
              Removed days - not booked, not charged
            </p>
            <p className="mt-1 text-sm font-bold text-[#252423]">
              {booking.excludedDates.map((d) => formatDayShort(d)).join(", ")}
            </p>
          </div>
        )}

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <DetailRow icon={Clock} label="Time (24h)" value={booking.time} />
          {isService ? (
            <>
              {booking.packageName && (
                <DetailRow icon={Package} label="Package" value={booking.packageName} />
              )}
              <DetailRow
                icon={MapPin}
                label="Where to deliver"
                value={booking.location ?? "Not provided"}
                wide
              />
            </>
          ) : (
            <>
              <DetailRow
                icon={UsersRound}
                label="Expected guests"
                value={`${booking.guests.toLocaleString()}${
                  booking.listing.capacity
                    ? ` · venue holds ${booking.listing.capacity.toLocaleString()}`
                    : ""
                }`}
              />
              {booking.listing.capacity && (
                <DetailRow
                  icon={Building2}
                  label="Venue capacity"
                  value={`Up to ${booking.listing.capacity.toLocaleString()} guests`}
                />
              )}
            </>
          )}
        </div>

        {booking.preferences && (
          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
                Client notes
              </p>
              <p className="mt-0.5 whitespace-pre-line text-sm font-semibold leading-6 text-[#252423]">
                {booking.preferences}
              </p>
            </div>
          </div>
        )}

        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-[#FFF7F2] px-4 py-3 text-tiny font-semibold leading-5 text-[#8A5A44]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
          {isService
            ? "Arrive with enough time to set up, and confirm the client has prepared the facilities your listing requires."
            : "Prepare the venue ahead of the start time and share any house rules with the client before the event."}
        </p>
      </section>

      {/*  Client  */}
      <section className={`${VENDOR_CARD} p-5 md:p-7`}>
        <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
          Client
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <ClientAvatar booking={booking} size={48} />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#252423]">
              {booking.client.name}
            </p>
            <p className="text-tiny font-semibold text-[#9A9AAE]">
              Booked {formatDay(booking.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {booking.client.email && (
            <p className="flex items-center gap-2.5 text-sm font-semibold text-[#6B5F57]">
              <Mail className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
              <span className="truncate">{booking.client.email}</span>
            </p>
          )}
          {booking.client.phone && (
            <p className="flex items-center gap-2.5 text-sm font-semibold text-[#6B5F57]">
              <Phone className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
              {booking.client.phone}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => showSoon("In-app chat with clients is coming soon.")}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F4F1EA] px-6 py-3.5 text-sm font-extrabold text-[#252423] transition-all hover:brightness-95 active:scale-[0.99]"
        >
          <MessageSquare className="h-4 w-4 text-[#B9401D]" aria-hidden="true" />
          Chat with client
        </button>
        <p className="mt-2.5 text-center text-tiny font-semibold text-[#9A9AAE]">
          Keep coordination on EventVnV so escrow protection applies.
        </p>
      </section>

      {/*  Payment, payout, refunds  */}
      <section className={`${VENDOR_CARD} p-5 md:p-7`}>
        <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
          Payment &amp; payout
        </h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <DetailRow icon={Hash} label="Booking reference" value={booking.bookingRef} />
          <DetailRow
            icon={ShieldCheck}
            label="Payment status"
            value={booking.paymentStatus}
          />
          <DetailRow icon={Clock} label="Paid at" value={formatTimestamp(booking.paidAt)} />
          <DetailRow
            icon={Landmark}
            label="Payout"
            value={payoutLabel}
          />
          {booking.payout?.transferCode && (
            <DetailRow
              icon={Wallet}
              label="Transfer code"
              value={booking.payout.transferCode}
            />
          )}
          {booking.payout?.completedAt && (
            <DetailRow
              icon={CheckCircle2}
              label="Credited at"
              value={formatTimestamp(booking.payout.completedAt)}
            />
          )}
        </div>

        {booking.refund && (
          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-[#FDF1EC] px-4 py-3">
            <Undo2 className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[#8A3A1C]">
                Refund {booking.refund.status} · {naira(booking.refund.amount)}
              </p>
              {booking.refund.description && (
                <p className="mt-0.5 text-tiny font-semibold leading-5 text-[#8A5A44]">
                  {booking.refund.description}
                </p>
              )}
            </div>
          </div>
        )}

        {booking.cancellationReason && (
          <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Cancelled: {booking.cancellationReason.replace(/_/g, " ")}
            {booking.cancelledAt ? ` · ${formatTimestamp(booking.cancelledAt)}` : ""}
          </p>
        )}
      </section>

      {/*  Actions  */}
      <section className={`${VENDOR_CARD} p-5 md:p-6`}>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B9401D] px-5 py-3.5 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.99]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Generate receipt
          </button>
          <button
            type="button"
            onClick={copyReference}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E8DDD2] px-5 py-3.5 text-sm font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] active:scale-[0.99]"
          >
            {copiedRef ? (
              <Check className="h-4 w-4 text-[#2D5A27]" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4 text-[#B9401D]" aria-hidden="true" />
            )}
            {copiedRef ? "Copied" : "Copy reference"}
          </button>
          <button
            type="button"
            onClick={() => showSoon("Listing preview from bookings is coming soon.")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E8DDD2] px-5 py-3.5 text-sm font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] active:scale-[0.99]"
          >
            {isService ? (
              <Package className="h-4 w-4 text-[#B9401D]" aria-hidden="true" />
            ) : (
              <Building2 className="h-4 w-4 text-[#B9401D]" aria-hidden="true" />
            )}
            View listing
          </button>
        </div>

        <AnimatePresence>
          {soon && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 rounded-full bg-[#F7F2EA] px-4 py-2 text-center text-tiny font-bold text-[#6B5F57]"
            >
              {soon}
            </motion.p>
          )}
        </AnimatePresence>
      </section>

      <DeclineBookingModal
        isOpen={declineOpen}
        booking={{
          id: booking.id,
          bookingRef: booking.bookingRef,
          clientName: booking.client.name,
          refundAmount: booking.money.total,
        }}
        onClose={() => setDeclineOpen(false)}
      />

      {/*  Printable booking receipt (vendor copy)  */}
      <div
        id="vendor-booking-receipt-print"
        aria-hidden="true"
        className="pointer-events-none absolute -left-2499.75 top-0 w-180 bg-white p-10 text-[#252423]"
      >
        <div className="flex items-start justify-between border-b border-dashed border-[#C9BFB2] pb-5">
          <div>
            <p className="text-2xl font-extrabold text-[#B9401D]">EventVnV</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B5F57]">
              Booking receipt · vendor copy
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold">{booking.bookingRef}</p>
            <p className="mt-1 text-xs font-semibold text-[#6B5F57]">
              {booking.status.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            {[
              ["Client", booking.client.name],
              ["Client email", booking.client.email ?? "-"],
              ["Client phone", booking.client.phone ?? "-"],
              [isService ? "Service" : "Venue", booking.listing.name],
              [
                isService ? "Event location" : "Venue address",
                booking.location ?? "-",
              ],
              ["Event dates", spans.map(spanLabel).join(" · ") || "-"],
              ["Time (24h)", booking.time],
              ...(booking.packageName ? [["Package", booking.packageName]] : []),
              ...(!isService
                ? [["Expected guests", booking.guests.toLocaleString()]]
                : []),
              ["Paid at", formatTimestamp(booking.paidAt)],
              ["Payout", payoutLabel],
            ].map(([label, value]) => (
              <tr key={String(label)}>
                <td className="py-2 pr-6 align-top font-semibold text-[#6B5F57]">{label}</td>
                <td className="py-2 text-right align-top font-bold">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mt-6 w-full border-t border-dashed border-[#C9BFB2] pt-4 text-sm">
          <tbody>
            <tr>
              <td className="py-2 font-semibold text-[#6B5F57]">Customer paid</td>
              <td className="py-2 text-right font-bold">{naira(booking.money.total)}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold text-[#6B5F57]">Listing subtotal</td>
              <td className="py-2 text-right font-bold">{naira(booking.money.subtotal)}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold text-[#6B5F57]">VAT (7.5%)</td>
              <td className="py-2 text-right font-bold">{naira(booking.money.vat)}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold text-[#6B5F57]">Commission (10%)</td>
              <td className="py-2 text-right font-bold">− {naira(booking.money.commission)}</td>
            </tr>
            <tr className="border-t border-[#C9BFB2]">
              <td className="py-3 text-base font-extrabold">Vendor payout</td>
              <td className="py-3 text-right text-base font-extrabold">
                {naira(booking.money.vendorNet)}
              </td>
            </tr>
          </tbody>
        </table>

        {booking.preferences && (
          <p className="mt-6 whitespace-pre-line rounded-lg bg-[#F7F2EA] p-4 text-xs font-semibold text-[#6B5F57]">
            Client notes: {booking.preferences}
          </p>
        )}

        <p className="mt-8 border-t border-[#E8DED2] pt-4 text-center text-[11px] font-semibold text-[#6B5F57]">
          Funds are held in escrow until the event is delivered and the dispute window
          closes · support@eventvnv.com
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #vendor-booking-receipt-print,
          #vendor-booking-receipt-print * {
            visibility: visible;
          }
          #vendor-booking-receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
          }
        }
      `}</style>
    </VendorPageShell>
  );
}
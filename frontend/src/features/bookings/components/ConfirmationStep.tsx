"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Copy,
  FileText,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Printer,
  ShieldCheck,
  StickyNote,
  UsersRound,
  XCircle,
} from "lucide-react";
import { addDays, dayKey, diffDays, toDay } from "@/features/search/utils/rangeSelection";
import { createConversation } from "@/features/chat/chat.api";
import type { BookingDetailsResponse } from "../booking.types";
import type { useBookingWizard } from "../hooks/useBookingWizard";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const FALLBACK_IMAGE = "/placeholder.jpg";

interface ConfirmationStepProps {
  wizard: ReturnType<typeof useBookingWizard>;
  variant?: "desktop" | "mobile";
}

//  Formatting helpers

/** 24-hour clock, straight from the stored TIME column. */
function formatTime(value: string | null | undefined): string {
  if (!value) return "-";
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return "-";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function naira(value: number): string {
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * The API stores an ENVELOPE (start_date → end_date) plus the interior days
 * the customer removed. Rebuild the contiguous spans so the confirmation
 * shows the dates that were actually booked - including single, non-adjacent
 * days - instead of a misleading continuous range. Mirrors resolveStay.
 */
function bookedSpans(
  startStr: string,
  endStr: string,
  excluded: string[]
): { from: Date; to: Date }[] {
  const start = toDay(startStr);
  const end = toDay(endStr);
  if (!start || !end || end < start) return [];
  const holes = new Set<string>();
  for (const raw of excluded ?? []) {
    const day = toDay(raw);
    if (day) holes.add(dayKey(day));
  }
  const spans: { from: Date; to: Date }[] = [];
  let segStart: Date | null = null;
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    if (holes.has(dayKey(cursor))) {
      if (segStart) {
        spans.push({ from: segStart, to: addDays(cursor, -1) });
        segStart = null;
      }
    } else if (!segStart) {
      segStart = cursor;
    }
  }
  if (segStart) spans.push({ from: segStart, to: end });
  return spans;
}

function spansLabel(spans: { from: Date; to: Date }[]): string {
  if (spans.length === 0) return "-";
  const parts = spans.map((span) =>
    diffDays(span.from, span.to) === 0
      ? formatDay(span.from)
      : `${formatDay(span.from)} – ${formatDay(span.to)}`
  );
  if (parts.length <= 3) return parts.join(" · ");
  return `${parts.slice(0, 3).join(" · ")} +${parts.length - 3} more`;
}

type StatusTone = "success" | "pending" | "closed";

function statusMeta(booking: BookingDetailsResponse): {
  tone: StatusTone;
  title: string;
  subtitle: string;
  pill: string;
  icon: React.ElementType;
} {
  const isService = booking.kind === "service";
  switch (booking.status) {
    case "confirmed":
    case "completed":
    case "processing_payout":
    case "payout_released":
      return {
        tone: "success",
        title: "Booking confirmed!",
        subtitle: isService
          ? `${booking.listing_title} is locked in for your event. Your vendor has your address and details.`
          : `Your reservation at ${booking.listing_title} is secured. A confirmation is on its way to your email.`,
        pill: "Confirmed",
        icon: Check,
      };
    case "paid":
    case "funds_held":
      return {
        tone: "pending",
        title: "Payment received",
        subtitle:
          "Your money is safe in escrow. The vendor has 24 hours to confirm - if they don't, we cancel and refund you in full automatically. Nothing for you to do.",
        pill: "Awaiting confirmation",
        icon: Clock3,
      };
    case "cancelled":
    case "declined":
    case "refunded":
      return {
        tone: "closed",
        title: booking.status === "refunded" ? "Booking refunded" : "Booking cancelled",
        subtitle:
          "This booking is no longer active. Any refund goes back to your original payment method within 3–10 business days.",
        pill: booking.status === "refunded" ? "Refunded" : "Cancelled",
        icon: XCircle,
      };
    case "failed":
      return {
        tone: "closed",
        title: "Payment not completed",
        subtitle:
          "We couldn't complete this payment. If money left your account, contact support with your booking reference and we'll reconcile it.",
        pill: "Failed",
        icon: XCircle,
      };
    default:
      return {
        tone: "pending",
        title: "Payment pending",
        subtitle:
          "We're still confirming this payment with your bank. This page updates as soon as it settles.",
        pill: "Pending",
        icon: Clock3,
      };
  }
}

const TONE_STYLES: Record<StatusTone, { circle: string; pill: string }> = {
  success: { circle: "bg-[#E8F3EC] text-[#2D5A27]", pill: "bg-[#E8F3EC] text-[#2D5A27]" },
  pending: { circle: "bg-[#FFF1E6] text-[#B9401D]", pill: "bg-[#FFF1E6] text-[#B9401D]" },
  closed: { circle: "bg-[#F1EFEA] text-[#6B5F57]", pill: "bg-[#F1EFEA] text-[#6B5F57]" },
};

//  Presentational atoms

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#B9401D] shadow-sm md:h-11 md:w-11">
        <Icon className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE] md:text-xs">
          {label}
        </p>
        <p className="mt-0.5 text-small font-bold leading-snug text-[#252423] md:text-base">
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryText({
  label,
  value,
  badge,
  badgeClass,
}: {
  label: string;
  value: string;
  badge?: boolean;
  badgeClass?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE] md:text-xs">
        {label}
      </p>
      {badge ? (
        <span
          className={`mt-2 inline-flex rounded-full px-3.5 py-1 text-xs font-extrabold ${badgeClass}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-1.5 text-base font-bold leading-snug text-[#252423] md:text-lg">{value}</p>
      )}
    </div>
  );
}

//  Step

export default function ConfirmationStep({ wizard, variant = "desktop" }: ConfirmationStepProps) {
  const router = useRouter();
  const booking = wizard.bookingDetails;
  const mobile = variant === "mobile";
  const [copied, setCopied] = useState(false);
  const [chatPending, setChatPending] = useState(false);

  if (wizard.isBookingLoading || !booking) {
    return (
      <section className={mobile ? "px-6 pb-32 pt-8" : "mx-auto max-w-5xl px-8 py-20"}>
        <div className="animate-pulse space-y-5">
          <div className="mx-auto h-20 w-20 rounded-full bg-[#EFE7DE]" />
          <div className="mx-auto h-7 w-2/3 rounded-full bg-[#EFE7DE]" />
          <div className="h-64 rounded-4xl bg-[#EFE7DE]" />
        </div>
        <p className="mt-6 text-center text-sm font-semibold text-[#9A9AAE]">
          Loading your confirmation…
        </p>
      </section>
    );
  }

  const isService = booking.kind === "service";
  const meta = statusMeta(booking);
  const tones = TONE_STYLES[meta.tone];
  const StatusIcon = meta.icon;

  const spans = bookedSpans(booking.start_date, booking.end_date, booking.excluded_dates ?? []);
  const dateLabel = spansLabel(spans);
  const dayCount = spans.reduce((total, span) => total + diffDays(span.from, span.to) + 1, 0);
  const timeLabel = `${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`;

  const total = Number(booking.total_amount) || 0;
  const subtotal =
    booking.subtotal_amount != null
      ? Number(booking.subtotal_amount)
      : Math.round((total / 1.075) * 100) / 100;
  const vat =
    booking.vat_amount != null
      ? Number(booking.vat_amount)
      : Math.round((total - subtotal) * 100) / 100;

  const vendorName =
    [booking.vendor_first_name, booking.vendor_last_name].filter(Boolean).join(" ").trim() ||
    booking.vendor_email ||
    "Your vendor";

  const locationLabel = isService ? "Event location" : "Venue address";
  const locationValue = isService
    ? booking.event_location || "Address not provided"
    : booking.listing_location || booking.listing_address || "Address not provided";

  const listingHref = `/listings/${isService ? "services" : "halls"}/${booking.listing_id}`;
  const image = booking.listing_image || FALLBACK_IMAGE;

  const preparationNote = isService
    ? "Ensure all necessary facilities are prepared on time - power, water, space and access as agreed with your vendor."
    : "Ensure to check into the venue on time and follow the house rules shared by your host.";

  async function handleChatWithVendor() {
    if (!booking || chatPending) return;
    setChatPending(true);
    try {
      const res = await createConversation({ bookingId: booking.id });
      router.push(`/messages?conversationId=${res.id}`);
    } catch (error) {
      console.error("Failed to start chat", error);
      router.push("/messages");
    } finally {
      setChatPending(false);
    }
  }

  async function handleCopyReference() {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(booking.booking_reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy reference", error);
    }
  }

  const hero = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="text-center"
    >
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.34, 1.56, 0.64, 1] }}
        className={`mx-auto flex items-center justify-center rounded-full ${tones.circle} ${
          mobile ? "h-20 w-20" : "h-20 w-20"
        }`}
      >
        <StatusIcon className={mobile ? "h-9 w-9" : "h-9 w-9"} aria-hidden="true" />
      </motion.span>
      <h1
        className={`mt-6 font-extrabold tracking-[-0.02em] text-[#252423] ${
          mobile ? "text-2xl" : "text-4xl md:text-5xl"
        }`}
      >
        {meta.title}
      </h1>
      <p
        className={`mx-auto mt-3 font-semibold leading-7 text-[#5E6588] ${
          mobile ? "max-w-md text-sm" : "max-w-2xl text-lg"
        }`}
      >
        {meta.subtitle}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className={`inline-flex rounded-full px-3.5 py-1.5 text-xs font-extrabold ${tones.pill}`}>
          {meta.pill}
        </span>
        <button
          type="button"
          onClick={handleCopyReference}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DDD2] bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#2D5A27]" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#B9401D]" aria-hidden="true" />
              {booking.booking_reference}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );

  const facts = (
    <>
      <SummaryRow
        icon={isService ? Package : Building2}
        label={isService ? "Service" : "Venue"}
        value={booking.listing_title}
      />
      {booking.package_name && (
        <SummaryRow icon={Package} label="Package" value={booking.package_name} />
      )}
      <SummaryRow icon={MapPin} label={locationLabel} value={locationValue} />
      <SummaryRow
        icon={CalendarDays}
        label={`Event dates · ${dayCount} ${dayCount === 1 ? "day" : "days"}`}
        value={dateLabel}
      />
      <SummaryRow icon={Clock} label="Time (24h)" value={timeLabel} />
      {!isService && (
        <SummaryRow
          icon={UsersRound}
          label="Guests"
          value={`${(booking.guests ?? 1).toLocaleString()} expected${
            booking.listing_capacity
              ? ` · venue holds ${Number(booking.listing_capacity).toLocaleString()}`
              : ""
          }`}
        />
      )}
      {booking.preferences && (
        <SummaryRow icon={StickyNote} label="Your notes to the vendor" value={booking.preferences} />
      )}
      <SummaryRow icon={Hash} label="Booking reference" value={booking.booking_reference} />
    </>
  );

  const preparationCard = (
    <div className="flex items-start gap-3 rounded-2xl bg-[#FFF7F2] p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#B9401D]" aria-hidden="true" />
      <p className="text-small font-semibold leading-6 text-[#8A5A44] md:text-sm">
        {preparationNote}
      </p>
    </div>
  );

  const vendorCard = (
    <div className={mobile ? "rounded-4xl bg-[#F4F1EA] p-6" : "rounded-4xl bg-[#F4F1EA] p-8"}>
      <h2 className="text-lg font-extrabold text-[#252423] md:text-xl">Your vendor</h2>
      <div className="mt-5 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-xl font-extrabold text-[#B9401D] shadow-sm">
          {vendorName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-extrabold text-[#252423]">{vendorName}</h3>
          <p className="text-xs font-semibold text-[#5E6588]">
            {isService ? "Service provider" : "Venue host"}
          </p>
        </div>
      </div>

      {booking.vendor_email && (
        <p className="mt-5 flex items-center gap-2.5 text-sm font-semibold text-[#6B5F57]">
          <Mail className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
          <span className="truncate">{booking.vendor_email}</span>
        </p>
      )}
      {booking.vendor_phone && (
        <p className="mt-3 flex items-center gap-2.5 text-sm font-semibold text-[#6B5F57]">
          <Phone className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
          {booking.vendor_phone}
        </p>
      )}

      <button
        type="button"
        onClick={handleChatWithVendor}
        disabled={chatPending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B9401D] px-6 py-4 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.99] disabled:opacity-60"
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        {chatPending ? "Opening chat…" : "Chat with vendor"}
      </button>
      <p className="mt-3 text-center text-tiny font-semibold text-[#9A9AAE]">
        Keep coordination on EventVnV so escrow protection applies.
      </p>
    </div>
  );

  const secondaryActions = (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E8DDD2] bg-white px-5 py-3.5 text-sm font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
      >
        <Printer className="h-4 w-4 text-[#B9401D]" aria-hidden="true" />
        Print receipt
      </button>
      <Link
        href="/saved?tab=bookings"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E8DDD2] bg-white px-5 py-3.5 text-sm font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
      >
        <FileText className="h-4 w-4 text-[#B9401D]" aria-hidden="true" />
        View my bookings
      </Link>
      <Link
        href={listingHref}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E8DDD2] bg-white px-5 py-3.5 text-sm font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] sm:col-span-2"
      >
        {isService ? <Package className="h-4 w-4 text-[#B9401D]" /> : <Building2 className="h-4 w-4 text-[#B9401D]" />}
        View listing
      </Link>
    </div>
  );

  return (
    <>
      {mobile ? (
        <section className="px-5 pb-56">
          {hero}

          <div className="mt-8 rounded-4xl bg-[#F4F1EA] p-6">
            <div className="flex items-center gap-4">
              <Image
                src={image}
                alt={booking.listing_title}
                width={72}
                height={72}
                className="h-18 w-18 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
                  Total paid
                </p>
                <p className="text-xl font-extrabold text-[#B9401D]">{naira(total)}</p>
                <p className="mt-0.5 text-tiny font-semibold text-[#9A9AAE]">
                  {naira(subtotal)} + {naira(vat)} VAT
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5 border-t border-[#E4DCD0] pt-6">{facts}</div>
            <div className="mt-6">{preparationCard}</div>
          </div>

          <div className="mt-6">{vendorCard}</div>
          <div className="mt-6">{secondaryActions}</div>

          <div className="fixed inset-x-0 bottom-20 z-40 border-t border-[#EFE8DE] bg-white/97 px-5 pb-[env(safe-area-inset-bottom,0px)] pt-3 shadow-[0_-12px_32px_rgba(34,27,18,0.08)] backdrop-blur">
            <button
              type="button"
              onClick={handleChatWithVendor}
              disabled={chatPending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#B9401D] py-4 text-small font-extrabold text-white transition-all active:scale-[0.99] disabled:opacity-60"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              {chatPending ? "Opening chat…" : "Chat with vendor"}
            </button>
            <Link
              href="/saved?tab=bookings"
              className="mt-2.5 flex w-full items-center justify-center gap-2 py-2 text-small font-extrabold text-[#555B7F]"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              View my bookings
            </Link>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-5xl px-8 py-14">
          {hero}

          <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <motion.article
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: EASE_OUT }}
              className="rounded-4xl bg-white p-8 shadow-[0_20px_44px_rgba(34,27,18,0.07)] md:p-10"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
                    {isService ? "Service" : "Venue"}
                  </p>
                  <h2 className="mt-1.5 truncate text-2xl font-extrabold text-[#252423]">
                    {booking.listing_title}
                  </h2>
                  <p className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-[#5E6588]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
                    {locationValue}
                  </p>
                </div>
                <Image
                  src={image}
                  alt={booking.listing_title}
                  width={96}
                  height={96}
                  className="h-24 w-24 shrink-0 rounded-[1.4rem] object-cover"
                />
              </div>

              <div className="mt-8 grid gap-7 border-t border-[#E8DED2] pt-8 md:grid-cols-2">
                <SummaryText label="Event dates" value={dateLabel} />
                <SummaryText label="Time (24h)" value={timeLabel} />
                {booking.package_name && (
                  <SummaryText label="Package" value={booking.package_name} />
                )}
                {!isService && (
                  <SummaryText
                    label="Guests"
                    value={`${(booking.guests ?? 1).toLocaleString()} expected`}
                  />
                )}
                {!isService && booking.listing_capacity && (
                  <SummaryText
                    label="Venue capacity"
                    value={`Up to ${Number(booking.listing_capacity).toLocaleString()} guests`}
                  />
                )}
                <SummaryText label="Total paid" value={naira(total)} />
                <SummaryText
                  label="Status"
                  value={meta.pill}
                  badge
                  badgeClass={tones.pill}
                />
                <SummaryText label="Reference" value={booking.booking_reference} />
              </div>

              {(booking.excluded_dates?.length ?? 0) > 0 && (
                <div className="mt-7 rounded-2xl bg-[#F7F2EA] px-4 py-3.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
                    Removed days · not charged
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#252423]">
                    {(booking.excluded_dates ?? [])
                      .map((raw) => {
                        const day = toDay(raw);
                        return day
                          ? day.toLocaleDateString("en-NG", { day: "numeric", month: "short" })
                          : null;
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}

              {booking.preferences && (
                <div className="mt-4 rounded-2xl bg-[#F7F2EA] px-4 py-3.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
                    Your notes to the vendor
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-[#252423]">
                    {booking.preferences}
                  </p>
                </div>
              )}

              <div className="mt-7">{preparationCard}</div>
              <div className="mt-7">{secondaryActions}</div>
            </motion.article>

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease: EASE_OUT }}
              className="h-fit space-y-6"
            >
              {vendorCard}
              <div className="rounded-4xl bg-white p-7 shadow-[0_20px_44px_rgba(34,27,18,0.07)]">
                <h3 className="text-sm font-extrabold text-[#252423]">Payment summary</h3>
                <div className="mt-4 space-y-2.5 text-sm font-semibold text-[#5E6588]">
                  <div className="flex justify-between gap-4">
                    <span>Subtotal</span>
                    <span className="text-[#252423]">{naira(subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>VAT (7.5%)</span>
                    <span className="text-[#252423]">{naira(vat)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-[#E8DED2] pt-3 text-base font-extrabold text-[#252423]">
                    <span>Total paid</span>
                    <span>{naira(total)}</span>
                  </div>
                </div>
                {booking.paid_at && (
                  <p className="mt-4 flex items-center gap-2 text-tiny font-semibold text-[#9A9AAE]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2D5A27]" aria-hidden="true" />
                    Paid on {new Date(booking.paid_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </motion.aside>
          </div>
        </section>
      )}

      {/*  Printable receipt 
          Rendered off-screen so the print stylesheet can promote it without
          any dependency. Mirrors the saved-hub ReceiptModal pattern. */}
      <div
        id="booking-receipt-print"
        aria-hidden="true"
        className="pointer-events-none absolute -left-2499.75 top-0 w-180 bg-white p-10 text-[#252423]"
      >
        <div className="flex items-start justify-between border-b border-dashed border-[#C9BFB2] pb-5">
          <div>
            <p className="text-2xl font-extrabold text-[#B9401D]">EventVnV</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B5F57]">
              Booking receipt
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold">{booking.booking_reference}</p>
            <p className="mt-1 text-xs font-semibold text-[#6B5F57]">{meta.pill}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            {[
              [isService ? "Service" : "Venue", booking.listing_title],
              ["Vendor", vendorName],
              [locationLabel, locationValue],
              ["Event dates", dateLabel],
              ["Time (24h)", timeLabel],
              ...(booking.package_name ? [["Package", booking.package_name]] : []),
              ...(!isService
                ? [["Guests", `${(booking.guests ?? 1).toLocaleString()} expected`]]
                : []),
              [
                "Paid on",
                booking.paid_at
                  ? new Date(booking.paid_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "-",
              ],
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
              <td className="py-2 font-semibold text-[#6B5F57]">Subtotal</td>
              <td className="py-2 text-right font-bold">{naira(subtotal)}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold text-[#6B5F57]">VAT (7.5%)</td>
              <td className="py-2 text-right font-bold">{naira(vat)}</td>
            </tr>
            <tr className="border-t border-[#C9BFB2]">
              <td className="py-3 text-base font-extrabold">Total paid</td>
              <td className="py-3 text-right text-base font-extrabold">{naira(total)}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-8 border-t border-[#E8DED2] pt-4 text-center text-[11px] font-semibold text-[#6B5F57]">
          Payments are held in escrow until the event is delivered. Quote your booking reference
          when contacting support@eventvnv.com · Thank you for booking with EventVnV.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #booking-receipt-print,
          #booking-receipt-print * {
            visibility: visible;
          }
          #booking-receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
          }
        }
      `}</style>
    </>
  );
}
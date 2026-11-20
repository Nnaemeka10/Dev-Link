"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CloudOff,
  Copy,
  CreditCard,
  Hash,
  Landmark,
  MapPin,
  Package,
  Printer,
  RotateCcw,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import VendorPageShell from "../components/VendorPageShell";
import BookingStatusPill from "../components/BookingStatusPill";
import { useVendorTransaction } from "../hooks/useVendorDashboard";
import {
  EASE_OUT,
  VENDOR_CARD,
  WAT_LABEL,
  allSpansLabel,
  bookedSpans,
  countBookedDays,
  formatDay,
  formatTimestamp,
  initialsOf,
  naira,
} from "../utils";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3">
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

function CopyRow({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#F0E9DF] py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
          {label}
        </p>
        <p className="mt-0.5 truncate font-mono text-tiny font-bold text-[#252423] md:text-xs">
          {value ?? "-"}
        </p>
      </div>
      {value && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E8DDD2] text-[#5E6588] transition-colors hover:border-[#B9401D]/40 hover:text-[#B9401D] active:scale-95"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-[#2D5A27]" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}

function TimelineStep({
  label,
  at,
  last,
  index,
}: {
  label: string;
  at: string | null;
  last: boolean;
  index: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: 0.06 * index, ease: EASE_OUT }}
      className="relative flex gap-4 pb-5 last:pb-0"
    >
      {!last && (
        <span
          aria-hidden="true"
          className="absolute left-2.25 top-5 h-full w-0.5 bg-[#E4DDD3]"
        />
      )}
      <span className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2D5A27] ring-4 ring-white">
        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-[#252423]">{label}</p>
        <p className="mt-0.5 text-tiny font-semibold text-[#9A9AAE]">{at ?? "-"}</p>
      </div>
    </motion.li>
  );
}

export default function VendorTransactionDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const { data, isLoading, isError, refetch } = useVendorTransaction(id || null);
  const [copiedRef, setCopiedRef] = useState(false);

  async function copyReference() {
    if (!data?.booking?.reference) return;
    try {
      await navigator.clipboard.writeText(data.booking.reference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 1800);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }

  if (isLoading) {
    return (
      <VendorPageShell width="narrow" back={{ href: "/vendor/transactions", label: "All transactions" }}>
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
          <div className="h-56 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
          <div className="h-40 animate-pulse rounded-[1.75rem] bg-[#EFE7DE]" />
        </div>
      </VendorPageShell>
    );
  }

  if (isError || !data) {
    return (
      <VendorPageShell width="narrow" back={{ href: "/vendor/transactions", label: "All transactions" }}>
        <div className={`${VENDOR_CARD} flex flex-col items-center px-6 py-16 text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
            <CloudOff className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold text-[#252423]">
            Transaction not found
          </h1>
          <p className="mt-1.5 max-w-sm text-sm font-semibold text-[#9A9AAE]">
            This payout may not belong to your account, or the link is out of date.
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
              href="/vendor/transactions"
              className="rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white transition-all hover:brightness-95"
            >
              All transactions
            </Link>
          </div>
        </div>
      </VendorPageShell>
    );
  }

  const booking = data.booking;
  const spans = booking
    ? bookedSpans(booking.startDate, booking.endDate, booking.excludedDates)
    : [];
  const dayCount = countBookedDays(spans);
  const dateLabel = allSpansLabel(spans);

  // The API pre-formats the event clock as "16:00 – 23:00" (Lagos wall-clock
  // TIME columns). Label it WAT so it reads identically to the booking page.
  const eventTimeLabel =
    booking && booking.time && booking.time !== "-"
      ? `${booking.time} ${WAT_LABEL}`
      : "-";

  const destinationLabel = data.destination
    ? `${data.destination.bankName} •••• ${data.destination.accountLast4}`
    : "Your registered bank account";

  // Every instant is rendered by formatTimestamp → "18 Nov 2026 · 09:24 WAT".
  const timeline = [
    { label: "Booking created", at: formatTimestamp(booking?.createdAt) },
    { label: "Customer payment received", at: formatTimestamp(booking?.paidAt) },
    { label: "Event ended", at: booking ? formatDay(booking.endDate) : null },
    { label: "Dispute window closed", at: formatTimestamp(booking?.disputeWindowClosesAt) },
    { label: "Payout initiated", at: formatTimestamp(data.payout?.dispatchedAt) },
    { label: "Credited to your bank", at: formatTimestamp(data.createdAt) },
  ];

  return (
    <VendorPageShell
      width="narrow"
      back={{ href: "/vendor/transactions", label: "All transactions" }}
    >
      {/*  Hero  */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: EASE_OUT }}
        className={`${VENDOR_CARD} overflow-hidden`}
      >
        <div
          aria-hidden="true"
          className="h-1.5 w-full bg-linear-to-r from-[#B9401D] via-[#C9993A] to-[#2D5A27]"
        />
        <div className="p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9A9AAE]">
              Payout
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
              Completed
            </span>
          </div>

          <p className="mt-3 font-man text-3xl font-black tabular-nums tracking-tight text-[#252423] xs:text-4xl">
            {naira(data.amount)}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#5E6588]">
            <Landmark className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            {destinationLabel}
          </p>
          <p className="mt-1 flex items-center gap-2 text-tiny font-semibold text-[#9A9AAE]">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formatTimestamp(data.createdAt)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-[#B9401D] px-5 py-3 text-xs font-extrabold text-white transition-all hover:brightness-95 active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print receipt
            </button>
            {booking && (
              <>
                <button
                  type="button"
                  onClick={copyReference}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E8DDD2] px-5 py-3 text-xs font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] active:scale-95"
                >
                  {copiedRef ? (
                    <Check className="h-3.5 w-3.5 text-[#2D5A27]" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-[#B9401D]" aria-hidden="true" />
                  )}
                  {copiedRef ? "Copied" : "Copy reference"}
                </button>
                <Link
                  href={`/vendor/bookings/${booking.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E8DDD2] px-5 py-3 text-xs font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] active:scale-95"
                >
                  View booking
                  <ArrowRight className="h-3.5 w-3.5 text-[#B9401D]" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/*  Money split  */}
      {booking && (
        <section className={`${VENDOR_CARD} p-5 md:p-7`}>
          <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
            How this payout was calculated
          </h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex justify-between gap-4 text-sm font-semibold text-[#5E6588]">
              <span>Customer paid (incl. VAT)</span>
              <span className="tabular-nums text-[#252423]">{naira(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm font-semibold text-[#5E6588]">
              <span>Listing subtotal</span>
              <span className="tabular-nums text-[#252423]">{naira(booking.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm font-semibold text-[#5E6588]">
              <span>VAT (7.5%) - remitted to tax authority</span>
              <span className="tabular-nums text-[#9A9AAE]">{naira(booking.vat)}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm font-semibold text-[#5E6588]">
              <span>EventVnV commission (10%)</span>
              <span className="tabular-nums text-[#B9401D]">
                − {naira(booking.commission)}
              </span>
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-[#F0E9DF] pt-3.5">
              <span className="text-sm font-extrabold text-[#252423]">Your payout</span>
              <span className="font-man text-xl font-black tabular-nums text-[#2D5A27]">
                {naira(booking.vendorNet)}
              </span>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-[#F7F2EA] px-4 py-3 text-tiny font-semibold leading-5 text-[#6B5F57]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
            VAT is collected from the customer on your behalf and never comes out of
            your earnings. Commission is charged on the pre-VAT subtotal only.
          </p>
        </section>
      )}

      {/*  Booking  */}
      {booking && (
        <section className={`${VENDOR_CARD} p-5 md:p-7`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
              Booking
            </h2>
            <BookingStatusPill status={booking.status} />
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <DetailRow
              icon={data.isService ? Package : Building2}
              label={data.isService ? "Service" : "Venue"}
              value={data.listing?.title ?? "-"}
            />
            <DetailRow icon={Hash} label="Reference" value={booking.reference} />
            <DetailRow
              icon={CalendarDays}
              label={`Event dates · ${dayCount} ${dayCount === 1 ? "day" : "days"}`}
              value={dateLabel}
            />
            <DetailRow icon={Clock} label="Event time" value={eventTimeLabel} />
            {booking.packageName && (
              <DetailRow icon={Package} label="Package" value={booking.packageName} />
            )}
            <DetailRow
              icon={MapPin}
              label={data.isService ? "Event location" : "Venue address"}
              value={
                (data.isService ? booking.eventLocation : data.listing?.location) ??
                "Not provided"
              }
            />
            {/* When it was booked and when it settled - WAT, labelled, so this
                receipt matches the customer's copy exactly. */}
            <DetailRow
              icon={CalendarClock}
              label="Booked on"
              value={formatTimestamp(booking.createdAt)}
            />
            <DetailRow
              icon={CreditCard}
              label="Paid on"
              value={formatTimestamp(booking.paidAt)}
            />
          </div>

          {data.client && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3">
              {data.client.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatars may be Google-hosted
                <img
                  src={data.client.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[#F0E9DF]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7D1C8] text-xs font-extrabold text-[#B9401D]"
                >
                  {initialsOf(data.client.name)}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A9AAE]">
                  Client
                </p>
                <p className="truncate text-sm font-extrabold text-[#252423]">
                  {data.client.name}
                </p>
              </div>
              <UserRound className="ml-auto h-4 w-4 shrink-0 text-[#C4BBAE]" aria-hidden="true" />
            </div>
          )}
        </section>
      )}

      {/*  Timeline  */}
      <section className={`${VENDOR_CARD} p-5 md:p-7`}>
        <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
          Payout timeline
        </h2>
        <ol className="mt-5">
          {timeline.map((step, index) => (
            <TimelineStep
              key={step.label}
              label={step.label}
              at={step.at}
              index={index}
              last={index === timeline.length - 1}
            />
          ))}
        </ol>
        <p className="mt-4 border-t border-[#F0E9DF] pt-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#C4BBAE]">
          All times shown in West Africa Time (WAT · Lagos)
        </p>
      </section>

      {/*  Transfer + ledger references  */}
      <section className={`${VENDOR_CARD} p-5 md:p-7`}>
        <h2 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
          Transfer &amp; ledger references
        </h2>
        <p className="mt-1 text-tiny font-semibold text-[#9A9AAE]">
          Quote these when contacting support or your bank.
        </p>
        <div className="mt-3">
          <CopyRow label="Booking reference" value={booking?.reference ?? null} />
          <CopyRow label="Paystack payment reference" value={data.paystackReference} />
          <CopyRow label="Dispatch reference" value={data.payout?.dispatchReference ?? null} />
          <CopyRow label="Paystack transfer code" value={data.payout?.transferCode ?? null} />
          <CopyRow label="Ledger transaction group" value={data.transactionGroup} />
          <CopyRow label="Ledger idempotency key" value={data.idempotencyKey} />
        </div>
        {data.destination?.accountName && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[#F7F2EA] px-4 py-3 text-tiny font-semibold text-[#6B5F57]">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
            Account name: {data.destination.accountName}
          </p>
        )}
      </section>

      <section className={`${VENDOR_CARD} flex flex-col gap-3 p-5 sm:flex-row sm:items-center md:p-6`}>
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2D5A27]" aria-hidden="true" />
        <p className="flex-1 text-tiny font-semibold leading-5 text-[#6B5F57]">
          Something looks wrong with this payout? Email{" "}
          <a
            href={`mailto:support@eventvnv.com?subject=${encodeURIComponent(
              `Payout query ${booking?.reference ?? data.id}`
            )}`}
            className="font-extrabold text-[#B9401D] underline underline-offset-2"
          >
            support@eventvnv.com
          </a>{" "}
          and quote the booking reference.
        </p>
      </section>

      {/*  Printable payout receipt  */}
      <div
        id="vendor-payout-receipt-print"
        aria-hidden="true"
        className="pointer-events-none absolute -left-2499.75 top-0 w-180 bg-white p-10 text-[#252423]"
      >
        <div className="flex items-start justify-between border-b border-dashed border-[#C9BFB2] pb-5">
          <div>
            <p className="text-2xl font-extrabold text-[#B9401D]">EventVnV</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B5F57]">
              Vendor payout receipt
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold">{booking?.reference ?? data.id}</p>
            <p className="mt-1 text-xs font-semibold text-[#6B5F57]">Completed</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            {[
              ["Credited to", destinationLabel],
              ["Account name", data.destination?.accountName ?? "-"],
              ["Credited on", formatTimestamp(data.createdAt)],
              [data.isService ? "Service" : "Venue", data.listing?.title ?? "-"],
              ["Client", data.client?.name ?? "-"],
              ["Event dates", dateLabel],
              ["Event time", eventTimeLabel],
              ...(booking ? [["Booked on", formatTimestamp(booking.createdAt)]] : []),
              ...(booking ? [["Paid on", formatTimestamp(booking.paidAt)]] : []),
              ...(booking && !data.isService
                ? [["Expected guests", booking.guests.toLocaleString()]]
                : []),
              ["Transfer code", data.payout?.transferCode ?? "-"],
            ].map(([label, value]) => (
              <tr key={String(label)}>
                <td className="py-2 pr-6 align-top font-semibold text-[#6B5F57]">{label}</td>
                <td className="py-2 text-right align-top font-bold">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {booking && (
          <table className="mt-6 w-full border-t border-dashed border-[#C9BFB2] pt-4 text-sm">
            <tbody>
              <tr>
                <td className="py-2 font-semibold text-[#6B5F57]">Customer paid</td>
                <td className="py-2 text-right font-bold">{naira(booking.totalAmount)}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-[#6B5F57]">Listing subtotal</td>
                <td className="py-2 text-right font-bold">{naira(booking.subtotal)}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-[#6B5F57]">VAT (7.5%)</td>
                <td className="py-2 text-right font-bold">{naira(booking.vat)}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-[#6B5F57]">Commission (10%)</td>
                <td className="py-2 text-right font-bold">− {naira(booking.commission)}</td>
              </tr>
              <tr className="border-t border-[#C9BFB2]">
                <td className="py-3 text-base font-extrabold">Your payout</td>
                <td className="py-3 text-right text-base font-extrabold">
                  {naira(data.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <p className="mt-8 border-t border-[#E8DED2] pt-4 text-center text-[11px] font-semibold text-[#6B5F57]">
          All times are West Africa Time (WAT · Lagos, UTC+01:00).
        </p>
        <p className="mt-1 text-center text-[11px] font-semibold text-[#6B5F57]">
          Ledger entry {data.id} · VAT is remitted to the tax authority and is not part
          of vendor earnings · support@eventvnv.com
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #vendor-payout-receipt-print,
          #vendor-payout-receipt-print * {
            visibility: visible;
          }
          #vendor-payout-receipt-print {
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
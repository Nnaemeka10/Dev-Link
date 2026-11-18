"use client";

import { Download } from "lucide-react";
import HubModal from "./HubModal";
import { useHubBookingDetails } from "../hooks/useSavedHub";
import type { MyBookingItem } from "../saved.types";
import {
  allSpansLabel,
  bookedSpans,
  countBookedDays,
  formatEventTimeLabel,
  formatWatDateTimeLabelled,
} from "@/lib/datetime";

function naira(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 font-semibold text-[#9A9AAE]">{label}</span>
      <span className="text-right font-bold text-[#252423]">{value}</span>
    </div>
  );
}

export default function ReceiptModal({
  isOpen,
  booking,
  onClose,
}: {
  isOpen: boolean;
  booking: MyBookingItem;
  onClose: () => void;
}) {
  const { data } = useHubBookingDetails(isOpen ? booking.id : null);
  const d = data ?? null;

  const spans = bookedSpans(booking.startDate, booking.endDate, booking.excludedDates);
  const dayCount = countBookedDays(spans);

  // Same split as the server: subtotal pre-VAT, VAT is the remainder.
  const total = booking.totalAmount;
  const fallbackSubtotal = Math.round((total / 1.075) * 100) / 100;
  const subtotal = d?.subtotal ?? fallbackSubtotal;
  const vat = d?.vat ?? Math.round((total - fallbackSubtotal) * 100) / 100;

  const isHall = booking.kind === "hall";
  const location = d?.location ?? booking.location;
  const packageName = d?.packageName ?? null;
  const guests = d?.guests ?? booking.guests ?? 1;

  function handlePrint() {
    window.print();
  }

  return (
    <HubModal isOpen={isOpen} title="Receipt" subtitle={booking.bookingReference} onClose={onClose}>
      <div id="receipt-print" className="rounded-2xl border border-[#F0E9DF] p-6">
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-[#E0D5C7] pb-4">
          <div>
            <p className="text-lg font-extrabold text-[#B9401D]">EventVnV</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9AAE]">Booking receipt</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#252423]">{booking.bookingReference}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#9A9AAE]">
              {booking.status.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 py-4 text-sm">
          <ReceiptRow label={isHall ? "Venue" : "Service"} value={booking.listingTitle} />
          <ReceiptRow label="Vendor" value={booking.vendorName} />
          {packageName && <ReceiptRow label="Package" value={packageName} />}
          {location && (
            <ReceiptRow label={isHall ? "Venue address" : "Event location"} value={location} />
          )}
          <ReceiptRow
            label={`Event dates · ${dayCount} ${dayCount === 1 ? "day" : "days"}`}
            value={allSpansLabel(spans)}
          />
          <ReceiptRow label="Event time" value={formatEventTimeLabel(booking.startTime, booking.endTime)} />
          {isHall && <ReceiptRow label="Guests" value={`${guests.toLocaleString()} expected`} />}

          {/* When it was booked and when it settled - WAT, with the label, so
              this receipt matches the vendor's copy exactly. */}
          <ReceiptRow label="Booked on" value={formatWatDateTimeLabelled(booking.createdAt)} />
          <ReceiptRow label="Paid on" value={formatWatDateTimeLabelled(booking.paidAt)} />
        </div>

        <div className="space-y-2 border-t border-dashed border-[#E0D5C7] pt-4 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-[#9A9AAE]">Subtotal</span>
            <span className="font-bold text-[#252423]">{naira(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-[#9A9AAE]">VAT (7.5%)</span>
            <span className="font-bold text-[#252423]">{naira(vat)}</span>
          </div>
          <div className="flex justify-between border-t border-[#F0E9DF] pt-2 text-base font-extrabold text-[#252423]">
            <span>Total paid</span><span>{naira(total)}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] font-semibold text-[#C4BBAE]">
          All times are West Africa Time (WAT · Lagos, UTC+01:00)
        </p>
        <p className="mt-1 text-center text-[10px] font-semibold text-[#C4BBAE]">
          Thank you for booking with EventVnV · support@eventvnv.com
        </p>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B9401D] py-3.5 text-sm font-extrabold text-white transition hover:brightness-95"
      >
        <Download className="h-4 w-4" /> Download / print receipt
      </button>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: absolute; inset: 0; margin: 24px; border: none; }
        }
      `}</style>
    </HubModal>
  );
}
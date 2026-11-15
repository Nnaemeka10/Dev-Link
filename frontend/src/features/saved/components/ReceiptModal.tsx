"use client";
import { Download } from "lucide-react";
import HubModal from "./HubModal";
import { useHubBookingDetails } from "../hooks/useSavedHub";
import type { MyBookingItem } from "../saved.types";

function naira(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}
function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
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

  function handlePrint() {
    window.print();
  }

  return (
    <HubModal isOpen={isOpen} title="Receipt" subtitle={booking.bookingReference} onClose={onClose}>
      <div id="receipt-print" className="rounded-2xl border border-[#F0E9DF] p-6">
        <div className="flex items-center justify-between border-b border-dashed border-[#E0D5C7] pb-4">
          <div>
            <p className="text-lg font-extrabold text-[#B9401D]">EventVnV</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9AAE]">Booking receipt</p>
          </div>
          <p className="text-xs font-bold text-[#9A9AAE]">{booking.bookingReference}</p>
        </div>

        <div className="space-y-2.5 py-4 text-sm">
          <div className="flex justify-between"><span className="font-semibold text-[#9A9AAE]">Listing</span><span className="font-bold text-[#252423]">{booking.listingTitle}</span></div>
          <div className="flex justify-between"><span className="font-semibold text-[#9A9AAE]">Vendor</span><span className="font-bold text-[#252423]">{booking.vendorName}</span></div>
          <div className="flex justify-between"><span className="font-semibold text-[#9A9AAE]">Dates</span><span className="font-bold text-[#252423]">{fmtDate(booking.startDate)}{booking.endDate !== booking.startDate ? ` → ${fmtDate(booking.endDate)}` : ""}</span></div>
          <div className="flex justify-between"><span className="font-semibold text-[#9A9AAE]">Paid on</span><span className="font-bold text-[#252423]">{booking.paidAt ? fmtDate(booking.paidAt.slice(0, 10)) : "—"}</span></div>
        </div>

        <div className="space-y-2 border-t border-dashed border-[#E0D5C7] pt-4 text-sm">
          <div className="flex justify-between"><span className="font-semibold text-[#9A9AAE]">Subtotal</span><span className="font-bold text-[#252423]">{naira(d?.subtotal ?? booking.totalAmount / 1.075)}</span></div>
          <div className="flex justify-between"><span className="font-semibold text-[#9A9AAE]">VAT (7.5%)</span><span className="font-bold text-[#252423]">{naira(d?.vat ?? booking.totalAmount - booking.totalAmount / 1.075)}</span></div>
          <div className="flex justify-between border-t border-[#F0E9DF] pt-2 text-base font-extrabold text-[#252423]"><span>Total</span><span>{naira(booking.totalAmount)}</span></div>
        </div>

        <p className="mt-4 text-center text-[10px] font-semibold text-[#C4BBAE]">Thank you for booking with EventVnV · support@eventvnv.com</p>
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
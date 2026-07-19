import Image, { StaticImageData } from "next/image";
import { MapPin, ShieldCheck } from "lucide-react";
// import { BOOKING_FEES, BOOKING_TOTAL, BOOKING_VENUE, PAYMENT_FEES, PAYMENT_TOTAL } from "../booking.data";

interface SummaryData {
  venueName: string;
  venueLocation: string;   // e.g. "Victoria Island, Lagos"
  venueImage: string | StaticImageData;      // image src
  eventName: string;       // e.g. "Corporate Dinner"
  eventDate: string;       // e.g. "December 24, 2024"
  guests: string;          // e.g. "350 Attendees"
  verified: boolean;
  fees: Fee[];
  total: string;           // formatted e.g. "₦495,000"
  totalNote?: string;      // e.g. "Includes all taxes and marketplace fees"
}

interface Fee {
  label: string;
  value: string;
  sublabel?: string; // e.g. "underline" fees like "Venue hire × 2 days"
}

// export function EstimateSummary({ onContinue }: { onContinue: () => void }) {
//   return (
//     <aside className="rounded-[2.2rem] h-fit bg-white p-8 shadow-[0_24px_54px_rgba(34,27,18,0.08)]">
//       <h2 className="text-2xl font-medium text-[#252423]">Estimated Cost</h2>
//       <div className="mt-7 space-y-5 border-b border-[#E8DED2] pb-6">
//         {BOOKING_FEES.map((fee) => (
//           <div key={fee.label} className="flex justify-between gap-8 text-base">
//             <span className="text-[#6B5F57]">{fee.label}</span>
//             <strong>{fee.value}</strong>
//           </div>
//         ))}
//       </div>
//       <div className="mt-6 flex items-end justify-between">
//         <div>
//           <p className="font-extrabold text-[#252423]">Total Estimate</p>
//           <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7B7E9B]">VAT inclusive where applicable</p>
//         </div>
//         <strong className="text-3xl font-extrabold text-[#B9401D]">{BOOKING_TOTAL}</strong>
//       </div>
//       <button type="button" onClick={onContinue} className="mt-8 w-full rounded-full bg-[#B9401D] px-8 py-5 text-lg font-extrabold text-white shadow-[0_16px_26px_rgba(185,64,29,0.2)]">
//         Proceed to Payment
//       </button>
//       <p className="mx-auto mt-6 max-w-xs text-center text-xs leading-5 text-[#555B7F]">
//         Your payment is secure. You won&apos;t be charged until the vendor confirms your booking request within 24 hours.
//       </p>
//     </aside>
//   );
// }

export function PaymentSummary({ summary, onPay, isProcessing }: { summary: SummaryData; onPay: () => void; isProcessing: boolean }) {
  return (
    <aside className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_54px_rgba(34,27,18,0.08)]">
      <div className="relative h-64">
        <Image src={summary.venueImage} alt={summary.venueName} fill className="object-cover brightness-75" sizes="34vw" />
        <div className="absolute bottom-6 left-8 text-white">
          <h2 className="text-xl font-extrabold">{summary.venueName}</h2>
          <p className="flex items-center gap-1 text-sm"><MapPin className="h-4 w-4" /> {summary.venueLocation}</p>
        </div>
      </div>
      
      <div className="p-8">
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-8 border-b border-[#E8DED2] pb-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Event Date</p>
            <p className="mt-2 font-extrabold">{summary.eventDate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Guests</p>
            <p className="mt-2 font-extrabold">{summary.guests}</p>
          </div>
        </div>

        <div className="mt-7 space-y-4">
          {summary.fees.map((fee) => (
            <div key={fee.label} className="flex items-start justify-between gap-4 text-sm">
              <span className={`text-[#555B7F] ${fee.sublabel ? "underline underline-offset-2" : ""}`}>
                {fee.label}
              </span>
              <strong className="shrink-0 text-[#252423]">{fee.value}</strong>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-[#E8E4DC] p-6">
          <div className="flex items-end justify-between">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Total Amount</p>
            <strong className="text-3xl font-extrabold text-[#B9401D]">{summary.total}</strong>
          </div>
          {summary.totalNote && <p className="mt-2 text-right text-[11px] text-[#9A756C]">{summary.totalNote}</p>}
        </div>
        
        <button 
          type="button" 
          onClick={onPay} 
          disabled={isProcessing}
          className="mt-8 w-full rounded-full bg-[#B9401D] px-8 py-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processing..." : "Pay Securely Now →"}
        </button>
        
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#555B7F]">
          <ShieldCheck className="h-3 w-3" /> Powered by Paystack
        </p>
      </div>
    </aside>
  );
}

// export function VenueSelectionCard() {
//   return (
//     <article className="flex items-center gap-6 rounded-[2.2rem] bg-white p-8 shadow-[0_24px_54px_rgba(34,27,18,0.06)]">
//       <Image src={venue.} alt={BOOKING_VENUE.name} className="h-28 w-28 rounded-[1.4rem] object-cover" />
//       <div>
//         <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#555B7F]">Current Selection</p>
//         <h2 className="mt-2 text-2xl font-extrabold text-[#252423]">{BOOKING_VENUE.name}</h2>
//         <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#555B7F]">
//           <MapPin className="h-4 w-4" />
//           {BOOKING_VENUE.location}
//         </p>
//         <p className="mt-2 text-xs font-extrabold text-[#B9401D]">{BOOKING_VENUE.capacity}</p>
//       </div>
//     </article>
//   );
// }

export function SecuritySignals() {
  return (
    <div className="mt-10 grid gap-6 text-sm font-extrabold md:grid-cols-3">
      {["256-bit SSL Encrypted", "Vendor Protection", "Verified Provider"].map((label) => (
        <div key={label} className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#B9401D]" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

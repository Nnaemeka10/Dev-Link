"use client";

import Image from "next/image";
import { ChevronDown, MapPin } from "lucide-react";
import type { BookingFormState } from "../booking.types";
// import { EstimateSummary, VenueSelectionCard } from "./BookingSummary";
import { DateTimeSection } from "./DateTimeSection";
import { useRouter } from "next/navigation";
import { ListingDetailsResponse } from "@/features/listings/details.types";
import { usePricingQuote } from "../hooks/usePricingQuote";

interface BookingDetailsStepProps {
  form: BookingFormState;
  listing: ListingDetailsResponse;
  onContinue: () => void;
  onUpdate: (patch: Partial<BookingFormState>) => void;
  variant?: "desktop" | "mobile";
}


export default function BookingDetailsStep({ form, listing, onContinue, onUpdate, variant = "desktop" }: BookingDetailsStepProps) {
  const router = useRouter();

  const gallery = listing.images.map((img) => img.url);
  const venueImage = listing.primaryImage?.url || gallery[0] || "/images/placeholder.jpg";

  const { data: quote, isLoading: isQuoteLoading } = usePricingQuote(listing.id, form.dateRange);

  const hasDates = !!(form.dateRange?.from && form.dateRange?.to);
  
  
  if (variant === "mobile") {
    
    return (
      <section className="px-6 pb-28">
        <article className="flex items-center gap-5 rounded-4xl bg-white p-5 shadow-[0_18px_40px_rgba(34,27,18,0.08)]">
          <Image src={venueImage} alt={listing.title} width={96} height={96} className="h-24 w-24 rounded-[1.4rem] object-cover" />
          <div>
            <h2 className="text-lg font-extrabold">{listing.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#555B7F]">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-[#FFE3A2] px-3 py-1 text-tiny font-extrabold">★ {listing.rating.toFixed(1)} ({listing.reviewCount})</p>
            <p className="mt-2 text-tiny font-extrabold text-[#B9401D]">{listing.capacity} Guests</p>
          </div>
        </article>
        <DateTimeSection 
          dateRange = {form.dateRange} 
          startTime = {form.startTime} 
          endTime = {form.endTime} 
          onDateRangeChange = { (dateRange) => onUpdate({ dateRange }) } 
          onStartTimeChange = { (time) => onUpdate({ startTime: time }) } 
          onEndTimeChange = { (time) => onUpdate({ endTime: time }) } 
          unavailableDates={listing.unavailableDates || []}
          listingId={listing.id}
        />
       

        <div className="mt-9 rounded-4xl bg-[#F4F1EA] p-6">
          <h2 className="text-2xl font-medium text-[#252423]">Estimated Cost</h2>
          {hasDates ? (
            <>
              <div className="mt-7 space-y-4 border-b border-[#E8DED2] pb-6">
                {isQuoteLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 w-3/4 rounded bg-gray-300"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-300"></div>
                  </div>
                ) : quote ? (
                  <>
                    <div className="flex justify-between gap-8 text-base">
                      <span className="text-[#6B5F57]">Venue hire ({quote.days} {quote.days === 1 ? 'day' : 'days'})</span>
                      <strong>₦{quote.subtotal.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between gap-8 text-base text-[#555B7F]">
                      <span>VAT (7.5%)</span>
                      <span>₦{quote.vat.toLocaleString()}</span>
                    </div>
                  </>
                ) : null}
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="font-extrabold text-[#252423]">Total Estimate</p>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7B7E9B]">Final amount calculated at checkout</p>
                </div>
                {quote && <strong className="text-3xl font-extrabold text-[#B9401D]">₦{quote.total.toLocaleString()}</strong>}
              </div>
            </>
          ) : (
            <div className="mt-7 py-10 text-center text-[#555B7F]">
              <p className="font-semibold">Select dates to calculate price</p>
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-20 z-40 flex items-center justify-between bg-bg-primary px-6 py-5 shadow-[0_-12px_32px_rgba(34,27,18,0.08)]">
          <button type="button" onClick={() => router.back()} className="font-extrabold text-[#555B7F]">‹ Back</button>
          <button type="button" onClick={onContinue} className="rounded-full bg-[#B9401D] px-10 py-4 font-extrabold text-white">Continue to Pay →</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-16 px-8 py-16 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="space-y-8">
        <article className="flex items-center gap-6 rounded-[2.2rem] bg-white p-8 shadow-[0_24px_54px_rgba(34,27,18,0.06)]">
          <Image src={venueImage} alt={listing.title} className="h-28 w-28 rounded-[1.4rem] object-cover" width={112} height={112} />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#555B7F]">Current Selection</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#252423]">{listing.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#555B7F]">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </p>
            <p className="mt-2 text-xs font-extrabold text-[#B9401D]">{listing.capacity} Guests</p>
          </div>
        </article>
        <DateTimeSection 
          dateRange = {form.dateRange} 
          startTime = {form.startTime} 
          endTime = {form.endTime} 
          onDateRangeChange = { (dateRange) => onUpdate({ dateRange }) } 
          onStartTimeChange = { (time) => onUpdate({ startTime: time }) } 
          onEndTimeChange = { (time) => onUpdate({ endTime: time }) } 
          unavailableDates={listing.unavailableDates}
          listingId={listing.id}
        />

        <aside className="rounded-[2.2rem] h-fit bg-white p-8 shadow-[0_24px_54px_rgba(34,27,18,0.08)]">
          <h2 className="text-2xl font-medium text-[#252423]">Estimated Cost</h2>
          {hasDates ? (
            <>
              <div className="mt-7 space-y-4 border-b border-[#E8DED2] pb-6">
                {isQuoteLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 w-3/4 rounded bg-gray-300"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-300"></div>
                  </div>
                ) : quote ? (
                  <>
                    <div className="flex justify-between gap-8 text-base">
                      <span className="text-[#6B5F57]">Venue hire ({quote.days} {quote.days === 1 ? 'day' : 'days'})</span>
                      <strong>₦{quote.subtotal.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between gap-8 text-base text-[#555B7F]">
                      <span>VAT (7.5%)</span>
                      <span>₦{quote.vat.toLocaleString()}</span>
                    </div>
                  </>
                ) : null}
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="font-extrabold text-[#252423]">Total Estimate</p>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7B7E9B]">Final amount calculated at checkout</p>
                </div>
                {quote && <strong className="text-3xl font-extrabold text-[#B9401D]">₦{quote.total.toLocaleString()}</strong>}
              </div>
            </>
          ) : (
            <div className="mt-7 py-10 text-center text-[#555B7F]">
              <p className="font-semibold">Select dates to calculate price</p>
            </div>
          )}
        <button type="button" onClick={onContinue} className="mt-8 w-full rounded-full bg-[#B9401D] px-8 py-5 text-lg font-extrabold text-white shadow-[0_16px_26px_rgba(185,64,29,0.2)]">
          Proceed to Payment
        </button>
      </aside>

        <details className="rounded-3xl bg-[#F4F1EA] p-6">
          <summary className="flex cursor-pointer items-center justify-between font-extrabold">Contract Terms & Cancellation Policy <ChevronDown className="h-4 w-4" /></summary>
          <p className="mt-4 text-sm leading-6 text-[#6B5F57]">By proceeding, you agree to venue house rules and deposit terms.</p>
        </details>
      </div>
      {/* <EstimateSummary onContinue={onContinue} /> */}
    </section>
  );
}

"use client";

import { AlertCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import type { BookingFormState } from "../booking.types";
import { PaymentSummary } from "./BookingSummary";

import { MobilePaymentDock } from "./MobilePaymentDock";
import { ListingDetailsResponse } from "@/features/listings/details.types";
import { useBookingWizard } from "../hooks/useBookingWizard";
import { apiFetch, ApiError } from "@/lib/api";
import { usePricingQuote } from "../hooks/usePricingQuote";


import { useState } from "react";

import { useEffect } from "react";
import { getPaystack } from "@/lib/paystack";
import { useRouter } from "next/navigation";


interface PaymentStepProps {
  form: BookingFormState;
  listing: ListingDetailsResponse; 
  wizard: ReturnType<typeof useBookingWizard>;
  variant?: "desktop" | "mobile";
}


export default function PaymentStep({ form, listing, wizard, variant = "desktop" }: PaymentStepProps) {

  useEffect(() => {
    void getPaystack();
  }, []);

  

  const router = useRouter();
 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePay = async () => {
    setErrorMessage(null); // Reset error message at the start   

    if(!form.dateRange?.from || !form.dateRange?.to) {
      setErrorMessage("Please select a valid date range before proceeding to payment.");
      return;
    }

    try {
      wizard.setIsProcessing(true);

      // 1. Create Pending Booking on Backend
       // Backend calculates the exact amount and saves booking as 'pending'
      const bookingRes = await apiFetch<{ bookingId: string; amount: number; currency: string }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          listingId: listing.id,
          startDate: form.dateRange.from.toISOString(),
          endDate: form.dateRange.to.toISOString(),
          startTime: form.startTime,
          endTime: form.endTime,
          preferences: form.preferences,
        }),
        redirectOn401: true, // Redirect to login if user is not authenticated
      });

      // 2. Initialize Paystack Payment
      const initRes = await apiFetch<{ accessCode: string; reference: string }>("/api/payments/initialize", {
        method: "POST",
        body: JSON.stringify({ bookingId: bookingRes.bookingId }),
        redirectOn401: true,
      });

      wizard.setPaymentData({
        bookingId: bookingRes.bookingId,
        amount: bookingRes.amount,
        currency: bookingRes.currency,
        accessCode: initRes.accessCode,
        reference: initRes.reference,
      });

      const popup = await getPaystack();
      
      popup.resumeTransaction(initRes.accessCode, {
        onSuccess: async () => {
          // 4. Verify Payment on Backend
          try{
            await apiFetch(`/api/payments/verify/${initRes.reference}`, { 
              method: "GET", 
              redirectOn401: true 
            });

            // 5. Clear Draft and Move to Confirmation Step
            wizard.clearDraft();
            router.push(`/bookings/${listing.id}?step=3&bookingId=${bookingRes.bookingId}`); //booking id to url so it survives refresh
          } catch (verifyError) {
            console.error("Payment verification failed:", verifyError);
            setErrorMessage("Payment was made but verification failed. Please contact support with reference: " + initRes.reference);
            wizard.setIsProcessing(false);
          }
        },

        onCancel: () => {
          wizard.setIsProcessing(false);
        },

        onError: () => {
          setErrorMessage("Payment failed. Please try again.");
          wizard.setIsProcessing(false);
        }
       
      });

    } catch (error) {
      console.error("Payment initialization failed:", error);
      if (error instanceof ApiError) {
        setErrorMessage(error.message || "Could not start payment process.");
      } else {
        setErrorMessage("An unexpected error occurred. Please check your network and try again.");
      }
      wizard.setIsProcessing(false);
    }
  };


  const { data: quote } = usePricingQuote(listing.id, form.dateRange);

  // Unified summary object for both Mobile and Desktop
  const paymentSummary = {
    venueName: listing.title,
    venueLocation: listing.location,
    venueImage: listing.primaryImage?.url || "/placeholder.jpg",
    eventName: "Event Booking",
    eventDate: form.dateRange?.from?.toLocaleDateString() || "Invalid Date",
    guests: `Up to ${listing.capacity} Guests`,
    verified: listing.autoApprove,
    fees: quote ? [
      { label: `Venue hire (${quote.days} ${quote.days === 1 ? 'day' : 'days'})`, value: `₦${quote.subtotal.toLocaleString()}` },
      { label: "VAT (7.5%)", value: `₦${quote.vat.toLocaleString()}` }
    ] : [],
    total: quote ? `₦${quote.total.toLocaleString()}` : "Calculating...",
    totalNote: "Includes all taxes and fees",
  };

  

  if (variant === "mobile") {
    return (
      <section className="px-6 pb-28">
        <h1 className="text-2xl font-medium">Review & Confirm</h1>
        <p className="mt-3 text-[#555B7F]">Confirm your details. You will be redirected to Paystack to complete payment securely.</p>
         {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#555B7F]">
          <ShieldCheck className="h-4 w-4 text-[#B9401D]" />
          256-bit SSL Encrypted Secure Checkout
        </div>

        <MobilePaymentDock summary={paymentSummary} onPay={handlePay} isProcessing={wizard.isProcessing} />
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-8 py-16 lg:grid-cols-[minmax(0,1fr)_29rem]">
      <div>
        <h1 className="text-4xl font-medium">Review & Pay</h1>
        <p className="mt-3 text-lg text-[#555B7F]">
          Click &ldquo;Pay Now&rdquo; to be redirected to our secure payment gateway. You will not be charged until the vendor confirms availability.
        </p>

         {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
        
        <div className="mt-9 rounded-4xl bg-[#F4F1EA] p-8">
          <div className="flex items-center gap-4">
            <LockKeyhole className="h-6 w-6 text-[#B9401D]" />
            <div>
              <h3 className="font-extrabold text-lg">Secure Backend Processing</h3>
              <p className="text-sm text-[#555B7F]">We do not store your card details. All transactions are processed by Paystack.</p>
            </div>
          </div>
        </div>
      </div>
      
      <PaymentSummary summary={paymentSummary} onPay={handlePay} isProcessing={wizard.isProcessing} />
    </section>
  );
}

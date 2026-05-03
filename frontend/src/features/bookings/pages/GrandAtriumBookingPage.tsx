"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BOOKING_STEPS, MOBILE_BOOKING_STEPS, BOOKING_STORAGE_KEY } from "../booking.data";
import BookingDetailsStep from "../components/BookingDetailsStep";
import BookingFooter from "../components/BookingFooter";
import { BookingNavHeader, DesktopBookingHeader, MobileBookingHeader } from "../components/BookingHeader";
import BookingStepper from "../components/BookingStepper";
import ConfirmationStep from "../components/ConfirmationStep";
import PaymentStep from "../components/PaymentStep";
import ReviewStep from "../components/ReviewStep";
import { useBookingWizard } from "../hooks/useBookingWizard";

export default function GrandAtriumBookingPage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const maxStep = isDesktop ? 4 : 3;
  const wizard = useBookingWizard(maxStep);
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeStep = Math.min(wizard.step, maxStep);

  // Sync URL query param (?step=X) with wizard state
  useEffect(() => {
    const urlStep = searchParams.get("step");
    if (urlStep) {
      const parsedStep = parseInt(urlStep, 10);
      if (!isNaN(parsedStep) && parsedStep > 0 && parsedStep <= maxStep) {
        if (wizard.step !== parsedStep) {
          wizard.goToStep(parsedStep);
        }
      } else if (!isNaN(parsedStep) && parsedStep > maxStep) {
        // If URL step exceeds maxStep, clamp it and update URL
        wizard.goToStep(maxStep);
        router.replace(`?step=${maxStep}`);
      }
    }
  }, [searchParams, maxStep, wizard, router]);

  function handlePaymentComplete() {
    wizard.goToStep(isDesktop ? 3 : 3);
  }

  function handleConfirmation() {
    wizard.clearDraft();
    wizard.goToStep(isDesktop ? 4 : 3);
  }

  // Keep this key centralized so a future server submission can clear any
  // stale autosaved fields alongside the successful booking response.
  void BOOKING_STORAGE_KEY;

  if (!isDesktop) {
    return (
      <main className="min-h-screen bg-bg-primary text-[#252423]">
        <MobileBookingHeader />
        {activeStep < 3 ? <BookingStepper labels={MOBILE_BOOKING_STEPS} step={activeStep} variant="mobile" /> : null}
        {activeStep === 1 ? (
          <BookingDetailsStep form={wizard.form} onContinue={() => wizard.goToStep(2)} onUpdate={wizard.updateForm} variant="mobile" />
        ) : null}
        {activeStep === 2 ? (
          <PaymentStep form={wizard.form} onPay={handleConfirmation} onUpdate={wizard.updateForm} variant="mobile" />
        ) : null}
        {activeStep === 3 ? <ConfirmationStep variant="mobile" /> : null}
      </main>
    );
  }

  const checkoutHeader = activeStep === 2;
  const confirmation = activeStep === 4;

  return (
    <main className="flex min-h-screen flex-col bg-bg-primary text-[#252423]">
      {confirmation ? <BookingNavHeader /> : <DesktopBookingHeader checkout={checkoutHeader} />}
      <div className="pt-8">
        <BookingStepper labels={BOOKING_STEPS} step={activeStep} />
      </div>
      {activeStep === 1 ? (
        <>
          <div className="mt-4 text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#B9401D]">Step 1: Booking Details</p>
            <h1 className="mt-2 text-4xl font-extrabold">Secure Your Canvas</h1>
          </div>
          <BookingDetailsStep form={wizard.form} onContinue={() => wizard.goToStep(2)} onUpdate={wizard.updateForm} />
        </>
      ) : null}
      {activeStep === 2 ? (
        <PaymentStep form={wizard.form} onPay={handlePaymentComplete} onUpdate={wizard.updateForm} />
      ) : null}
      {activeStep === 3 ? (
        <ReviewStep form={wizard.form} onConfirm={handleConfirmation} />
      ) : null}
      {activeStep === 4 ? <ConfirmationStep /> : null}
      <BookingFooter />
    </main>
  );
}

"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BOOKING_STEPS, MOBILE_BOOKING_STEPS, BOOKING_STORAGE_KEY } from "../booking.data";
import BookingDetailsStep from "../components/BookingDetailsStep";
import BookingFooter from "../components/BookingFooter";
import { DesktopBookingHeader, MobileBookingHeader } from "../components/BookingHeader";
import BookingStepper from "../components/BookingStepper";
import ConfirmationStep from "../components/ConfirmationStep";
import PaymentStep from "../components/PaymentStep";
import ReviewStep from "../components/ReviewStep";
import { useBookingWizard } from "../hooks/useBookingWizard";

export default function GrandAtriumDetailsPage() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const maxStep = isDesktop ? 4 : 3;
  const wizard = useBookingWizard(maxStep);
  const activeStep = Math.min(wizard.step, maxStep);

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


  return (
    <main className="flex min-h-screen flex-col bg-bg-primary text-[#252423]">
      <DesktopBookingHeader checkout={checkoutHeader} />
      <div className="pt-8">
        <BookingStepper labels={BOOKING_STEPS} step={activeStep} />
      </div>
      {activeStep === 1 ? (
        <>
          <div className="mt-4 text-center">
            <h1 className="mt-2 text-4xl font-extrabold">Secure Your Venue</h1>
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

"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BOOKING_STEPS, MOBILE_BOOKING_STEPS, BOOKING_STORAGE_KEY } from "../booking.data";
import BookingDetailsStep from "../components/BookingDetailsStep";
import BookingFooter from "../components/BookingFooter";
import { DesktopBookingHeader, MobileBookingHeader } from "../components/BookingHeader";
import BookingStepper from "../components/BookingStepper";
import ConfirmationStep from "../components/ConfirmationStep";
import PaymentStep from "../components/PaymentStep";
// import ReviewStep from "../components/ReviewStep";
import { useBookingWizard } from "../hooks/useBookingWizard";
import MobileDock from "@/components/layout/MobileDock";

import SideNavBar from "@/components/layout/SideNavBar";
import { useParams } from "next/navigation";

export default function BookingDetails() {
  const isTablet = useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const maxStep = 3;
  const params = useParams();
  const listingId = params?.id as string;
  const wizard = useBookingWizard(maxStep, listingId);
  const activeStep = Math.min(wizard.step, maxStep);

  if (wizard.isListingLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading booking details...</div>;
  }

  if (!wizard.listing) {
    return <div className="min-h-screen flex items-center justify-center">Listing not found.</div>;
  }

  // function handlePaymentComplete() {
  //   wizard.goToStep(isDesktop ? 3 : 3);
  // }

  // function handleConfirmation() {
  //   wizard.clearDraft();
  //   wizard.goToStep(isDesktop ? 4 : 3);
  // }

  // // Keep this key centralized so a future server submission can clear any
  // // stale autosaved fields alongside the successful booking response.
  // void BOOKING_STORAGE_KEY;

  if (!isDesktop && !isTablet) {
    return (
      <main className="min-h-screen bg-bg-primary text-[#252423]">
        <MobileBookingHeader activestep={activeStep} />
        {activeStep < 3 && <BookingStepper labels={["Details", "Pay", "Confirm"]} step={activeStep} variant="mobile" />}
        {activeStep === 1 && (
          <BookingDetailsStep form={wizard.form} listing={wizard.listing} onContinue={() => wizard.goToStep(2)} onUpdate={wizard.updateForm} variant="mobile" />
        )}
        {activeStep === 2 && (
          <PaymentStep form={wizard.form} listing={wizard.listing} wizard={wizard} variant="mobile" />
        )}
        {activeStep === 3 && <ConfirmationStep wizard={wizard} variant="mobile" />}
        <MobileDock />
      </main>
    );
  }

  const checkoutHeader = activeStep === 2;

  if(isDesktop) {
    return (
      <main className="flex min-h-screen bg-bg-primary text-[#252423]">
        <SideNavBar />
        <div className="ml-[15%] w-[85%] flex flex-col">
          <DesktopBookingHeader checkout={checkoutHeader} />
          <div className="pt-8">
            <BookingStepper labels={["Booking Details", "Review & Pay", "Confirmation"]} step={activeStep} />
          </div>
          {activeStep === 1 && (
            <>
              <div className="mt-4 text-center">
                <h1 className="mt-2 text-4xl font-extrabold">Secure Your Venue</h1>
              </div>
              <BookingDetailsStep form={wizard.form} listing={wizard.listing} onContinue={() => wizard.goToStep(2)} onUpdate={wizard.updateForm} />
            </>
          )}
          {activeStep === 2 && (
            <PaymentStep form={wizard.form} listing={wizard.listing} wizard={wizard} />
          )}
          {/* {activeStep === 3 && (
            <ReviewStep form={wizard.form} onConfirm={handleConfirmation} />
          )} */}
          {activeStep === 3 && <ConfirmationStep wizard={wizard} />}
          <BookingFooter />
        </div>
      
    </main>
    );
  }




  return (
    <main className="flex min-h-screen flex-col bg-bg-primary text-[#252423]">
      <DesktopBookingHeader checkout={checkoutHeader} />
      <div className="pt-8">
        <BookingStepper labels={BOOKING_STEPS} step={activeStep} />
      </div>
      {activeStep === 1 && (
        <>
          <div className="mt-4 text-center">
            <h1 className="mt-2 text-4xl font-extrabold">Secure Your Venue</h1>
          </div>
          <BookingDetailsStep form={wizard.form} listing={wizard.listing} onContinue={() => wizard.goToStep(2)} onUpdate={wizard.updateForm} />
        </>
      )}
      {activeStep === 2 && (
        <PaymentStep form={wizard.form} listing={wizard.listing} wizard={wizard} />
      )}
      {/* {activeStep === 3 && (
        <ReviewStep form={wizard.form} onConfirm={handleConfirmation} />
      ) : null} */}
      {activeStep === 3 && <ConfirmationStep wizard={wizard} />}
      <BookingFooter />
    </main>
  );
}

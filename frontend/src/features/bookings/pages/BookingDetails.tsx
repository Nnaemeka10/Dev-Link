"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import MobileDock from "@/components/layout/MobileDock";
import SideNavBar from "@/components/layout/SideNavBar";
import { BOOKING_STEPS } from "../booking.data";
import BookingDetailsStep, { bookingDetailsRequirements } from "../components/BookingDetailsStep";
import BookingFooter from "../components/BookingFooter";
import { DesktopBookingHeader, MobileBookingHeader } from "../components/BookingHeader";
import BookingStepper from "../components/BookingStepper";
import ConfirmationStep from "../components/ConfirmationStep";
import PaymentStep from "../components/PaymentStep";
import { useBookingWizard } from "../hooks/useBookingWizard";

const MAX_STEP = 3;
const MOBILE_STEP_LABELS = ["Details", "Pay", "Confirm"];

export default function BookingDetails() {
  const isTablet = useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const params = useParams();
  const searchParams = useSearchParams();
  const listingId = params?.id as string;

  const wizard = useBookingWizard(MAX_STEP, listingId);

  if (wizard.isListingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <span
            className="h-9 w-9 animate-spin rounded-full border-2 border-[#B9401D]/25 border-t-[#B9401D]"
            aria-hidden="true"
          />
          <p className="text-sm font-bold text-[#5E6588]">Loading booking details…</p>
        </div>
      </div>
    );
  }

  if (!wizard.listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
        <div className="max-w-sm rounded-4xl bg-white p-8 text-center shadow-[0_20px_44px_rgba(34,27,18,0.07)]">
          <h1 className="text-xl font-extrabold text-[#252423]">Listing not found</h1>
          <p className="mt-2 text-sm font-semibold text-[#5E6588]">
            This listing may have been removed or is no longer published.
          </p>
        </div>
      </div>
    );
  }

  const listing = wizard.listing;
  const isService = listing.kind === "service";

  // Step guards - a deep link can never skip required input, and step 3
  // always needs a booking to show.
  const requirements = bookingDetailsRequirements(wizard.form, listing);
  const hasBookingId = Boolean(wizard.paymentData?.bookingId || searchParams.get("bookingId"));
  let activeStep = Math.min(wizard.step, MAX_STEP);
  if (activeStep === 2 && requirements.length > 0) activeStep = 1;
  if (activeStep === 3 && !hasBookingId) activeStep = 1;

  const stepOneHeading = isService ? "Book this service" : "Secure your venue";

  const stepOne = (variant?: "desktop" | "mobile") => (
    <BookingDetailsStep
      form={wizard.form}
      listing={listing}
      onContinue={() => wizard.goToStep(2)}
      onUpdate={wizard.updateForm}
      variant={variant}
    />
  );

  const stepTwo = (variant?: "desktop" | "mobile") => (
    <PaymentStep form={wizard.form} listing={listing} wizard={wizard} variant={variant} />
  );

  //  Mobile 
  if (!isDesktop && !isTablet) {
    return (
      <main className="min-h-screen bg-bg-primary text-[#252423]">
        <MobileBookingHeader activestep={activeStep} />
        {activeStep < 3 && (
          <BookingStepper labels={MOBILE_STEP_LABELS} step={activeStep} variant="mobile" />
        )}
        {activeStep === 1 && stepOne("mobile")}
        {activeStep === 2 && stepTwo("mobile")}
        {activeStep === 3 && <ConfirmationStep wizard={wizard} variant="mobile" />}
        <MobileDock />
      </main>
    );
  }

  //  Desktop (xl+) 
  if (isDesktop) {
    return (
      <main className="flex min-h-screen bg-bg-primary text-[#252423]">
        <SideNavBar />
        <div className="ml-[15%] flex w-[85%] flex-col">
          <DesktopBookingHeader checkout={activeStep === 2} />
          <div className="pt-6">
            <BookingStepper labels={BOOKING_STEPS} step={activeStep} />
          </div>
          {activeStep === 1 && (
            <>
              <div className="mt-2 px-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-[-0.02em]">{stepOneHeading}</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-[#5E6588]">
                  {isService
                    ? "Pick your dates, tell the vendor where to show up, and review the price before you pay."
                    : "Pick your dates, confirm your guest count, and review the price before you pay."}
                </p>
              </div>
              {stepOne()}
            </>
          )}
          {activeStep === 2 && stepTwo()}
          {activeStep === 3 && <ConfirmationStep wizard={wizard} />}
          <BookingFooter />
        </div>
      </main>
    );
  }

  //  Tablet (md → xl) 
  return (
    <main className="flex min-h-screen flex-col bg-bg-primary text-[#252423]">
      <DesktopBookingHeader checkout={activeStep === 2} />
      <div className="pt-6">
        <BookingStepper labels={BOOKING_STEPS} step={activeStep} />
      </div>
      {activeStep === 1 && (
        <>
          <div className="mt-2 px-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-[-0.02em]">{stepOneHeading}</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-[#5E6588]">
              {isService
                ? "Pick your dates, tell the vendor where to show up, and review the price before you pay."
                : "Pick your dates, confirm your guest count, and review the price before you pay."}
            </p>
          </div>
          {stepOne()}
        </>
      )}
      {activeStep === 2 && stepTwo()}
      {activeStep === 3 && <ConfirmationStep wizard={wizard} />}
      <BookingFooter />
      <MobileDock />
    </main>
  );
}
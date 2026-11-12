"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BOOKING_STORAGE_KEY, DEFAULT_BOOKING_FORM } from "../booking.data";
import type { BookingFormState, BookingSummaryData } from "../booking.types";
import type { DateRange } from "@/features/search/utils/searchSchema";
import { useListingDetails } from "@/features/listings/hooks/useListingDetails";
import { useBookingDetails } from "./useBookingDetails";

function clampStep(step: number, maxStep: number) {
  if (Number.isNaN(step)) return 1;
  return Math.min(Math.max(step, 1), maxStep);
}

function readStoredForm(): BookingFormState {
  if (typeof window === "undefined") {
    return DEFAULT_BOOKING_FORM;
  }
  try {
    const stored = window.localStorage.getItem(BOOKING_STORAGE_KEY);
    if (!stored) return DEFAULT_BOOKING_FORM;
    const parsed = JSON.parse(stored);

    const dateRange: DateRange | undefined = parsed.dateRange
      ? {
          from: new Date(parsed.dateRange.from),
          to: parsed.dateRange.to ? new Date(parsed.dateRange.to) : undefined,
        }
      : undefined;

    const dateRanges: DateRange[] = Array.isArray(parsed.dateRanges)
      ? parsed.dateRanges
          .filter((r: any) => r?.from)
          .map((r: any) => ({
            from: new Date(r.from),
            to: r.to ? new Date(r.to) : undefined,
          }))
      : [];

    // Seed from the detail-page hand-off: BookingCard / MobileBookingDock /
    // ServiceDetails write only { dateRange } into localStorage before
    // navigating here, so a fresh wizard starts with that single range.
    if (!dateRanges.length && dateRange?.from) {
      dateRanges.push({ from: dateRange.from, to: dateRange.to ?? dateRange.from });
    }

    return { ...DEFAULT_BOOKING_FORM, ...parsed, dateRange, dateRanges };
  } catch {
    return DEFAULT_BOOKING_FORM;
  }
}

export function useBookingWizard(maxStep: number, listingId: string) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = clampStep(Number(searchParams.get("step") ?? "1"), maxStep);

  const [form, setForm] = useState<BookingFormState>(() => readStoredForm());
  const [paymentData, setPaymentData] = useState<BookingSummaryData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check URL for bookingId
  const bookingIdFromUrl = searchParams.get("bookingId");

  // Fetch listing data for step 1 and 2 based on URL param
  const { data: listing, isLoading: isListingLoading } = useListingDetails(listingId);
  const { data: bookingDetails, isLoading: isBookingLoading } = useBookingDetails(
    step === 3 ? (paymentData?.bookingId || bookingIdFromUrl || null) : null
  );

  useEffect(() => {
    window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const actions = useMemo(
    () => ({
      clearDraft() {
        window.localStorage.removeItem(BOOKING_STORAGE_KEY);
      },
      goToStep(nextStep: number) {
        router.push(`${pathname}?step=${clampStep(nextStep, maxStep)}`);
      },
      updateForm(patch: Partial<BookingFormState>) {
        setForm((current) => ({ ...current, ...patch }));
      },
      setPaymentData(data: BookingSummaryData | null) {
        setPaymentData(data);
      },
      setIsProcessing(processing: boolean) {
        setIsProcessing(processing);
      },
    }),
    [maxStep, pathname, router]
  );

  return {
    ...actions,
    form,
    step,
    listing,
    isListingLoading,
    bookingDetails,
    isBookingLoading,
    paymentData,
    isProcessing,
  };
}
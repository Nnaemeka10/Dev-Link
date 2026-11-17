"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BOOKING_STORAGE_KEY,
  DEFAULT_BOOKING_FORM,
  MAX_PREFERENCES_LENGTH,
} from "../booking.data";
import type {
  BookingEventLocation,
  BookingFormState,
  BookingSummaryData,
} from "../booking.types";
import type { DateRange } from "@/features/search/utils/searchSchema";
import { useListingDetails } from "@/features/listings/hooks/useListingDetails";
import { useBookingDetails } from "./useBookingDetails";

function clampStep(step: number, maxStep: number) {
  if (Number.isNaN(step)) return 1;
  return Math.min(Math.max(step, 1), maxStep);
}

/** "HH:MM" / "HH:MM:SS" -> minutes past midnight, or null. */
function timeToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

function normalizeTime(value: unknown, fallback: string): string {
  const minutes = timeToMinutes(value);
  return minutes === null ? fallback : minutesToTime(minutes);
}

function normalizeEventLocation(value: unknown): BookingEventLocation {
  const base = DEFAULT_BOOKING_FORM.eventLocation;
  if (!value || typeof value !== "object") return { ...base };
  const raw = value as Record<string, unknown>;
  return {
    address: typeof raw.address === "string" ? raw.address : "",
    stateId: typeof raw.stateId === "string" ? raw.stateId : "",
    lgaId: typeof raw.lgaId === "string" ? raw.lgaId : "",
    country: "Nigeria",
  };
}

function toValidDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Reads the draft, tolerating every shape it has shipped in:
 *  • detail pages hand off { dateRange } (hall) or { packageId, dateRange }
 *    (service) - and now { dateRanges } for multi-range selections;
 *  • older drafts have no eventLocation / guests at all.
 * Everything is normalized field-by-field so a stale or partial payload can
 * never put the wizard into an invalid state.
 */
function readStoredForm(): BookingFormState {
  if (typeof window === "undefined") return DEFAULT_BOOKING_FORM;

  try {
    const stored = window.localStorage.getItem(BOOKING_STORAGE_KEY);
    if (!stored) return DEFAULT_BOOKING_FORM;
    const parsed = JSON.parse(stored) as Record<string, unknown>;

    const handoffFrom = toValidDate((parsed.dateRange as Record<string, unknown> | undefined)?.from);
    const handoffTo = toValidDate((parsed.dateRange as Record<string, unknown> | undefined)?.to);
    const dateRange: DateRange | undefined = handoffFrom
      ? { from: handoffFrom, to: handoffTo }
      : undefined;

    // The map's return type is annotated as DateRange | null (not the narrower
    // { from: Date; to: Date } | null TS would infer) so the type predicate
    // below is valid: a predicate must be assignable to its parameter type,
    // and DateRange.to is optional.
    const dateRanges: DateRange[] = Array.isArray(parsed.dateRanges)
      ? (parsed.dateRanges as Record<string, unknown>[])
          .map((r): DateRange | null => {
            const from = toValidDate(r?.from);
            if (!from) return null;
            return { from, to: toValidDate(r?.to) ?? from };
          })
          .filter((r): r is DateRange => r !== null)
      : [];

    // Seed from a single-range hand-off so a fresh wizard starts with it.
    if (!dateRanges.length && dateRange?.from) {
      dateRanges.push({ from: dateRange.from, to: dateRange.to ?? dateRange.from });
    }

    const guestsRaw = Number(parsed.guests);
    const guests =
      Number.isFinite(guestsRaw) && guestsRaw >= 1 ? Math.floor(guestsRaw) : DEFAULT_BOOKING_FORM.guests;

    const preferences =
      typeof parsed.preferences === "string"
        ? parsed.preferences.slice(0, MAX_PREFERENCES_LENGTH)
        : "";

    return {
      ...DEFAULT_BOOKING_FORM,
      contactEmail: typeof parsed.contactEmail === "string" ? parsed.contactEmail : "",
      contactName: typeof parsed.contactName === "string" ? parsed.contactName : "",
      dateRange,
      dateRanges,
      startTime: normalizeTime(parsed.startTime, DEFAULT_BOOKING_FORM.startTime),
      endTime: normalizeTime(parsed.endTime, DEFAULT_BOOKING_FORM.endTime),
      preferences,
      termsAccepted: parsed.termsAccepted === true,
      packageId: typeof parsed.packageId === "string" ? parsed.packageId : "",
      eventLocation: normalizeEventLocation(parsed.eventLocation),
      guests,
    };
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

  const bookingIdFromUrl = searchParams.get("bookingId");

  const { data: listing, isLoading: isListingLoading } = useListingDetails(listingId);
  const { data: bookingDetails, isLoading: isBookingLoading } = useBookingDetails(
    step === 3 ? paymentData?.bookingId || bookingIdFromUrl || null : null
  );

  // Persist the draft. Dates survive a refresh; the payment popup's hold does
  // not (it lives server-side and is released the moment the popup closes).
  useEffect(() => {
    try {
      window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* private mode / quota - non-fatal */
    }
  }, [form]);

  /**
   * One-time-per-listing normalization once the listing arrives:
   *  • services default to the popular (or first) package, so a price always
   *    exists and the customer never has to guess;
   *  • hall times are clamped into the venue's operating window, because the
   *    draft may have been started against a different listing.
   * Guarded by a ref so it can never loop or fight the user's edits.
   */
  const appliedListingRef = useRef<string | null>(null);
  useEffect(() => {
    if (!listing || appliedListingRef.current === listing.id) return;
    appliedListingRef.current = listing.id;

    setForm((current) => {
      const next = { ...current };

      if (listing.kind === "service" && listing.packages?.length) {
        const stillValid = listing.packages.some((p) => p.id === current.packageId);
        if (!stillValid) {
          const preferred = listing.packages.find((p) => p.isPopular) ?? listing.packages[0];
          next.packageId = preferred.id;
        }
      }

      const from = timeToMinutes(listing.availableFrom);
      const to = timeToMinutes(listing.availableTo);
      if (listing.kind === "hall" && from !== null && to !== null && to - from >= 60) {
        const windowEnd = Math.floor(to / 30) * 30;
        const latestStart = windowEnd - 30;
        const start = Math.min(Math.max(timeToMinutes(current.startTime) ?? from, from), latestStart);
        const rawEnd = timeToMinutes(current.endTime) ?? windowEnd;
        const end = Math.min(Math.max(rawEnd, start + 30), windowEnd);
        next.startTime = minutesToTime(start);
        next.endTime = minutesToTime(end);
      }

      return next;
    });
  }, [listing]);

  const actions = useMemo(
    () => ({
      clearDraft() {
        try {
          window.localStorage.removeItem(BOOKING_STORAGE_KEY);
        } catch {
          /* non-fatal */
        }
        setForm(DEFAULT_BOOKING_FORM);
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
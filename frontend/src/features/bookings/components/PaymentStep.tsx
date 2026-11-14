"use client";
import { AlertCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import type { BookingFormState } from "../booking.types";
import { PaymentSummary } from "./BookingSummary";
import { MobilePaymentDock } from "./MobilePaymentDock";
import { ListingDetailsResponse } from "@/features/listings/details.types";
import { useBookingWizard } from "../hooks/useBookingWizard";
import { apiFetch, ApiError } from "@/lib/api";
import { usePricingQuote } from "../hooks/usePricingQuote";
import { useState, useEffect, useRef, useCallback } from "react";
import { getPaystack } from "@/lib/paystack";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toLocalDateString } from "@/lib/dates";
import { envelope, excludedDates } from "@/features/search/utils/rangeSelection";
import HoldCountdown from "./HoldCountdown";

type PaystackInstance = Awaited<ReturnType<typeof getPaystack>>;

/** Must match the backend lease model: 30s ping, 2-min lease, 30-min hard cap. */
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_MAX_FAILURES = 3;

interface PaymentStepProps {
  form: BookingFormState;
  listing: ListingDetailsResponse;
  wizard: ReturnType<typeof useBookingWizard>;
  variant?: "desktop" | "mobile";
  /** Vestigial - the countdown is driven by internal state (holdDeadline). */
  holdExpiresAt?: string | null;
}

export default function PaymentStep({ form, listing, wizard, variant = "desktop" }: PaymentStepProps) {
  useEffect(() => {
    void getPaystack();
  }, []);

  const queryClient = useQueryClient();
  const router = useRouter();
  // Stable actions (useMemo'd in the wizard) so callbacks below never churn.
  const { setIsProcessing, setPaymentData, clearDraft } = wizard;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  // Shows the HARD 30-minute session deadline, not the 2-minute lease.
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);

  // Envelope + holes derived from the multi-range selection.
  const dateRange = envelope(form.dateRanges);
  const excluded = excludedDates(form.dateRanges);

  // The hold lives ONLY while the Paystack popup is open. Refs let the
  // heartbeat / timers / unmount / pagehide paths act without stale closures,
  // and distinguish "user abandoned checkout" from "payment succeeded".
  const liveHoldRef = useRef<{ bookingId: string } | null>(null);
  const paymentSucceededRef = useRef(false);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatFailuresRef = useRef(0);
  const popupRef = useRef<PaystackInstance | null>(null);
  const transactionRef = useRef<{ id: string } | null>(null);

  const releaseHold = useCallback(async (bookingId: string) => {
    try {
      await apiFetch(`/api/bookings/${bookingId}/release-hold`, { method: "POST" });
    } catch (error) {
      // Non-fatal: the 2-minute lease + 30s cron are the safety net.
      console.error("Failed to release date hold:", error);
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    heartbeatFailuresRef.current = 0;
  }, []);

  const stopSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  /** Close the Paystack iframe (used for timeout / connection-loss fencing). */
  const closePaystackPopup = useCallback(() => {
    const popup = popupRef.current;
    const transaction = transactionRef.current;
    popupRef.current = null;
    transactionRef.current = null;
    if (!popup || !transaction) return;
    try {
      popup.cancelTransaction(transaction.id);
    } catch (error) {
      // Some builds throw if the iframe is already gone - safe to ignore.
      console.error("Failed to close Paystack popup:", error);
    }
  }, []);

  /**
   * Single teardown path: stop timers, release the hold (unless money moved),
   * clear the countdown, surface the right message. Idempotent - a second
   * call sees liveHoldRef === null and only re-asserts the message.
   */
  const teardownHold = useCallback(
    (opts: { release: boolean; info?: string; error?: string }) => {
      stopHeartbeat();
      stopSessionTimer();
      const hold = liveHoldRef.current;
      liveHoldRef.current = null;
      setHoldExpiresAt(null);
      if (opts.release && hold && !paymentSucceededRef.current) {
        void releaseHold(hold.bookingId);
      }
      setIsProcessing(false);
      if (opts.info) {
        setInfoMessage(opts.info);
        setErrorMessage(null);
      }
      if (opts.error) {
        setErrorMessage(opts.error);
        setInfoMessage(null);
      }
    },
    [releaseHold, stopHeartbeat, stopSessionTimer, setIsProcessing]
  );

  /** Session died (hard cap / fenced lease / lost connectivity). */
  const expireSession = useCallback(
    (message: string) => {
      // Tear down FIRST so the onCancel fired by cancelTransaction sees a
      // null hold and keeps this specific message instead of the generic one.
      teardownHold({ release: true, info: message });
      closePaystackPopup();
    },
    [teardownHold, closePaystackPopup]
  );

  /**
   * Starts the lease heartbeat + the hard-cap timer the moment the popup
   * opens. The server is authoritative: alive:false means the lease lapsed
   * (fenced - never resurrected) or the 30-minute cap passed.
   */
  const startHoldSession = useCallback(
    (bookingId: string, holdDeadlineIso: string | null) => {
      stopHeartbeat();
      stopSessionTimer();

      const ping = async () => {
        // Guard against stale pings from a previous session.
        if (!liveHoldRef.current || liveHoldRef.current.bookingId !== bookingId) return;
        try {
          const res = await apiFetch<{ alive: boolean }>(
            `/api/bookings/${bookingId}/heartbeat`,
            { method: "POST" }
          );
          if (!liveHoldRef.current || liveHoldRef.current.bookingId !== bookingId) return;
          if (!res.alive) {
            expireSession(
              "Your payment session ended and the dates were released. Tap Pay to start a new one."
            );
            return;
          }
          heartbeatFailuresRef.current = 0;
        } catch {
          if (!liveHoldRef.current || liveHoldRef.current.bookingId !== bookingId) return;
          heartbeatFailuresRef.current += 1;
          if (heartbeatFailuresRef.current >= HEARTBEAT_MAX_FAILURES) {
            expireSession(
              "We lost contact with the server, so your date hold was released. Check your connection and tap Pay to try again."
            );
          }
        }
      };

      void ping(); // renew the lease immediately on popup open
      heartbeatTimerRef.current = setInterval(() => void ping(), HEARTBEAT_INTERVAL_MS);

      if (holdDeadlineIso) {
        const ms = new Date(holdDeadlineIso).getTime() - Date.now();
        if (ms <= 0) {
          expireSession(
            "Your payment session ended and the dates were released. Tap Pay to start a new one."
          );
          return;
        }
        sessionTimerRef.current = setTimeout(() => {
          expireSession(
            "Your 30-minute payment session ended and the dates were released. Tap Pay to start a new one."
          );
        }, ms);
      }
    },
    [expireSession, stopHeartbeat, stopSessionTimer]
  );

  // Release the hold if the user leaves the payment step (back to details,
  // closes the wizard) or closes the tab while the popup is open. A successful
  // payment is NEVER released - it converts to a paid booking instead.
  useEffect(() => {
    const releaseOnPageHide = () => {
      const hold = liveHoldRef.current;
      if (!hold || paymentSucceededRef.current) return;
      const url = `/api/bookings/${hold.bookingId}/release-hold`;
      // Same-origin /api path (the one apiFetch uses). Best-effort on tab close;
      // the lease + cron guarantee release even if the browser drops this.
      if (navigator.sendBeacon) navigator.sendBeacon(url);
      else void fetch(url, { method: "POST", keepalive: true, credentials: "include" });
    };
    window.addEventListener("pagehide", releaseOnPageHide);
    return () => {
      window.removeEventListener("pagehide", releaseOnPageHide);
      stopHeartbeat();
      stopSessionTimer();
      const hold = liveHoldRef.current;
      if (hold && !paymentSucceededRef.current) void releaseHold(hold.bookingId);
    };
  }, [releaseHold, stopHeartbeat, stopSessionTimer]);

  // Changing the date selection invalidates any stale hold + countdown.
  const dateRangesKey = JSON.stringify(form.dateRanges);
  useEffect(() => {
    const hold = liveHoldRef.current;
    if (hold && !paymentSucceededRef.current) {
      liveHoldRef.current = null;
      stopHeartbeat();
      stopSessionTimer();
      void releaseHold(hold.bookingId);
    }
    setHoldExpiresAt(null);
  }, [dateRangesKey, releaseHold, stopHeartbeat, stopSessionTimer]);

  const handlePay = async () => {
    // A previous payment already succeeded but verification is pending -
    // never charge the user twice. Point them at support instead.
    if (paymentSucceededRef.current) {
      setErrorMessage(
        "Your previous payment succeeded but confirmation is still pending. Please contact support with your payment reference instead of paying again."
      );
      return;
    }
    if (!dateRange?.from || !dateRange.to) {
      setErrorMessage("Please select your booking dates before paying.");
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsProcessing(true);
    stopHeartbeat();
    stopSessionTimer();

    let createdBookingId: string | null = null;

    try {
      // 1. Create the booking = start the hold (reuses + renews a live one).
      const bookingRes = await apiFetch<{
        bookingId: string;
        amount: number;
        currency: string;
        status: string;
        expiresAt?: string;
        holdDeadline?: string;
      }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          listingId: listing.id,
          startDate: toLocalDateString(dateRange.from),
          endDate: toLocalDateString(dateRange.to),
          excludedDates: excluded,
          startTime: form.startTime,
          endTime: form.endTime,
          preferences: form.preferences,
          packageId: form.packageId,
        }),
        redirectOn401: true,
      });

      createdBookingId = bookingRes.bookingId;
      liveHoldRef.current = { bookingId: bookingRes.bookingId };
      // Countdown + auto-close use the HARD deadline (created_at + 30 min).
      const deadline = bookingRes.holdDeadline ?? bookingRes.expiresAt ?? null;
      setHoldExpiresAt(deadline);

      // 2. Initialize Paystack (backend renews the lease here).
      const initRes = await apiFetch<{ accessCode: string; reference: string }>(
        "/api/payments/initialize",
        {
          method: "POST",
          body: JSON.stringify({ bookingId: bookingRes.bookingId }),
          redirectOn401: true,
        }
      );

      setPaymentData({
        bookingId: bookingRes.bookingId,
        amount: bookingRes.amount,
        currency: bookingRes.currency,
        accessCode: initRes.accessCode,
        reference: initRes.reference,
      });

      // 3. Open the popup. The hold is live for exactly this window.
      const popup = await getPaystack();
      const transaction = popup.resumeTransaction(initRes.accessCode, {
        onSuccess: async () => {
          // Money moved: convert hold - paid. Never release from here on.
          paymentSucceededRef.current = true;
          liveHoldRef.current = null;
          stopHeartbeat();
          stopSessionTimer();
          setHoldExpiresAt(null);
          popupRef.current = null;
          transactionRef.current = null;
          try {
            await apiFetch(`/api/payments/verify/${initRes.reference}`, {
              method: "GET",
              redirectOn401: true,
            });
            await queryClient.invalidateQueries({ queryKey: ["booking-details", bookingRes.bookingId] });
            await queryClient.invalidateQueries({ queryKey: ["listing", "details", listing.id] });
            clearDraft();
            router.push(`/bookings/${listing.id}?step=3&bookingId=${bookingRes.bookingId}`);
          } catch (verifyError) {
            console.error("Payment verification failed:", verifyError);
            setErrorMessage(
              "Payment was made but verification failed. Please contact support with reference: " + initRes.reference
            );
            setIsProcessing(false);
          }
        },
        onCancel: () => {
          popupRef.current = null;
          transactionRef.current = null;
          // Programmatic close (timeout / connection loss) already tore down
          // with its own message - don't overwrite it.
          if (!liveHoldRef.current) {
            setIsProcessing(false);
            return;
          }
          teardownHold({
            release: true,
            info: "Payment cancelled. Your date hold was released - tap Pay to reserve these dates again.",
          });
        },
        onError: () => {
          popupRef.current = null;
          transactionRef.current = null;
          if (!liveHoldRef.current) {
            setIsProcessing(false);
            return;
          }
          teardownHold({
            release: true,
            error: "Payment failed. Your date hold was released. Please try again.",
          });
        },
      });

      popupRef.current = popup;
      transactionRef.current = transaction ?? null;

      // 4. Keep the lease alive while the popup is open + enforce the cap.
      startHoldSession(bookingRes.bookingId, deadline);
    } catch (error) {
      // If a hold was created but the popup never opened, release it.
      if (createdBookingId) {
        liveHoldRef.current = null;
        setHoldExpiresAt(null);
        stopHeartbeat();
        stopSessionTimer();
        void releaseHold(createdBookingId);
      }

      if (error instanceof ApiError) {
        // Expected business rejections - "You cannot book your own listing",
        // dates taken (409), session expired (400), etc. These are NOT
        // exceptions: surface the message inline and keep them out of
        // console.error so the Next.js dev overlay doesn't flag a crash.
        setErrorMessage(error.message || "Could not start payment process.");
        if (error.status >= 500) {
          console.error("Payment initialization failed:", error);
        }
      } else {
        // Genuine unexpected failure (network drop, bug) - worth logging.
        console.error("Payment initialization failed:", error);
        setErrorMessage("An unexpected error occurred. Please check your network and try again.");
      }
      setIsProcessing(false);
    }
  };

  const { data: quote } = usePricingQuote(listing.id, dateRange, form.packageId, excluded);
  const days = quote?.days;
  const selectedPackage = listing.packages?.find(p => p.id === form.packageId);
  const hireLabel = selectedPackage
    ? `${selectedPackage.name} (${days ?? '...'} ${days === 1 ? 'day' : 'days'})`
    : (listing.kind === 'service' ? `Service fee (${days ?? '...'} ${days === 1 ? 'day' : 'days'})`
      : `Venue hire (${days ?? '...'} ${days === 1 ? 'day' : 'days'})`);

  // Unified summary object for both Mobile and Desktop
  const paymentSummary = {
    venueName: listing.title,
    venueLocation: listing.location,
    venueImage: listing.primaryImage?.url || "/placeholder.jpg",
    eventName: "Event Booking",
    eventDateFrom: dateRange?.from?.toLocaleDateString() || "Invalid Date",
    eventDateTo: dateRange?.to?.toLocaleDateString(),
    guests: listing.kind === 'service' ? undefined : `Up to ${listing.capacity} Guests`,
    verified: listing.autoApprove,
    fees: quote ? [
      { label: hireLabel, value: `₦${quote.subtotal.toLocaleString()}` },
      { label: "VAT (7.5%)", value: `₦${quote.vat.toLocaleString()}` },
    ] : [],
    total: quote ? `₦${quote.total.toLocaleString()}` : "Calculating...",
    totalNote: "Includes all taxes and fees",
  };

  if (variant === "mobile") {
    return (
      <section className="px-6 pb-28">
        <h1 className="text-2xl font-medium">Review & Confirm</h1>
        <p className="mt-3 text-[#555B7F]">
          Confirm your details. Your dates are held only while the secure payment popup is open -
          close it and they&apos;re released instantly.
        </p>
        <HoldCountdown expiresAt={holdExpiresAt} className="mt-6" />

        {infoMessage && (
          <div className="mt-4 rounded-xl border border-[#E8DDD2] bg-[#F7F2EA] p-4 text-sm font-semibold text-[#5E6588]">
            {infoMessage}
          </div>
        )}

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

        <MobilePaymentDock summary={paymentSummary} onPay={handlePay} isProcessing={wizard.isProcessing} holdExpiresAt={holdExpiresAt} />
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-8 py-16 lg:grid-cols-[minmax(0,1fr)_29rem]">
      <div>
        <h1 className="text-4xl font-medium">Review & Pay</h1>
        <p className="mt-3 text-lg text-[#555B7F]">
          Tap Pay to open our secure payment popup. Your dates are held only while it&apos;s open -
          close it and they&apos;re released instantly. Payment is held in escrow until the vendor confirms.
        </p>
        <HoldCountdown expiresAt={holdExpiresAt} className="mt-5" />
        {infoMessage && (
          <div className="mt-6 rounded-xl border border-[#E8DDD2] bg-[#F7F2EA] p-4 text-sm font-semibold text-[#5E6588]">
            {infoMessage}
          </div>
        )}

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

      <PaymentSummary summary={paymentSummary} onPay={handlePay} isProcessing={wizard.isProcessing} holdExpiresAt={holdExpiresAt} />
    </section>
  );
}
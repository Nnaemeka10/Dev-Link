"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ListingDetailsResponse } from "@/features/listings/details.types";
import { getPaystack } from "@/lib/paystack";
import { apiFetch, ApiError } from "@/lib/api";
import { toLocalDateString } from "@/lib/dates";
import { useNigeriaLgas, useNigeriaStates } from "@/hooks/useNigeriaLocations";
import { diffDays, envelope, excludedDates, finalizeRanges } from "@/features/search/utils/rangeSelection";
import type { BookingFormState, PaymentSummaryData } from "../booking.types";
import { usePricingQuote } from "../hooks/usePricingQuote";
import type { useBookingWizard } from "../hooks/useBookingWizard";
import { bookingDetailsRequirements } from "./BookingDetailsStep";
import { PaymentSummary, SecuritySignals } from "./BookingSummary";
import { MobilePaymentDock } from "./MobilePaymentDock";
import HoldCountdown from "./HoldCountdown";

type PaystackInstance = Awaited<ReturnType<typeof getPaystack>>;

/** Must match the backend lease model: 30s ping, 2-min lease, 30-min hard cap. */
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_MAX_FAILURES = 3;
const FALLBACK_IMAGE = "/placeholder.jpg";
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function naira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

/** "10 Dec 2026 – 14 Dec 2026 · 16 Dec 2026 +1" - split ranges included. */
function formatDateRangesLabel(ranges: BookingFormState["dateRanges"]): string {
  const done = finalizeRanges(ranges);
  if (done.length === 0) return "No dates selected";
  const parts = done.map((range) =>
    diffDays(range.from, range.to) === 0
      ? formatDay(range.from)
      : `${formatDay(range.from)} – ${formatDay(range.to)}`
  );
  if (parts.length <= 2) return parts.join(" · ");
  return `${parts.slice(0, 2).join(" · ")} +${parts.length - 2} more`;
}

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
  const mobile = variant === "mobile";

  // Stable actions (useMemo'd in the wizard) so callbacks below never churn.
  const { setIsProcessing, setPaymentData, clearDraft } = wizard;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  // Shows the HARD 30-minute session deadline, not the 2-minute lease.
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);

  // Envelope + holes derived from the multi-range selection.
  const dateRange = envelope(form.dateRanges);
  const excluded = excludedDates(form.dateRanges);
  const isService = listing.kind === "service";

  const { data: quote } = usePricingQuote(listing.id, dateRange, form.packageId, excluded);
  const { data: states = [] } = useNigeriaStates();
  const { data: lgas = [] } = useNigeriaLgas(isService ? form.eventLocation.stateId : null);

  const missing = bookingDetailsRequirements(form, listing);
  const selectedPackage = listing.packages?.find((pkg) => pkg.id === form.packageId);

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
          const res = await apiFetch<{ alive: boolean }>(`/api/bookings/${bookingId}/heartbeat`, {
            method: "POST",
          });
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

  // Changing the selection (dates OR package) invalidates any stale hold:
  // both are part of the server's reuse key, so the old hold is abandoned.
  const selectionKey = `${JSON.stringify(form.dateRanges)}|${form.packageId ?? ""}`;
  useEffect(() => {
    const hold = liveHoldRef.current;
    if (hold && !paymentSucceededRef.current) {
      liveHoldRef.current = null;
      stopHeartbeat();
      stopSessionTimer();
      void releaseHold(hold.bookingId);
    }
    setHoldExpiresAt(null);
  }, [selectionKey, releaseHold, stopHeartbeat, stopSessionTimer]);

  const eventLocationText = useMemo(() => {
    if (!isService) return listing.location;
    const stateName = states.find((s) => s.id === form.eventLocation.stateId)?.name;
    const lgaName = lgas.find((l) => l.id === form.eventLocation.lgaId)?.name;
    return [form.eventLocation.address.trim(), lgaName, stateName, "Nigeria"]
      .filter(Boolean)
      .join(", ");
  }, [isService, listing.location, states, lgas, form.eventLocation]);

  const handlePay = async () => {
    // A previous payment already succeeded but verification is pending -
    // never charge the user twice. Point them at support instead.
    if (paymentSucceededRef.current) {
      setErrorMessage(
        "Your previous payment succeeded but confirmation is still pending. Please contact support with your payment reference instead of paying again."
      );
      return;
    }
    if (missing.length > 0) {
      setErrorMessage(`Before you pay: ${missing.join(", ").toLowerCase()}.`);
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
          packageId: form.packageId || undefined,
          // Services travel to the customer: the delivery address is mandatory
          // and resolved server-side against nigeria_states / nigeria_lgas.
          eventLocation: isService
            ? {
                address: form.eventLocation.address.trim(),
                stateId: form.eventLocation.stateId,
                lgaId: form.eventLocation.lgaId,
                country: "Nigeria",
              }
            : null,
          guests: isService ? 1 : form.guests,
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
          // Money moved: convert hold -> paid. Never release from here on.
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
            setIsRedirecting(true);
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["booking-details", bookingRes.bookingId],
              }),
              queryClient.invalidateQueries({ queryKey: ["listing", "details", listing.id] }),
              queryClient.invalidateQueries({ queryKey: ["listing", "availability", listing.id] }),
              queryClient.invalidateQueries({ queryKey: ["saved-hub"] }),
            ]);
            clearDraft();
            router.push(`/bookings/${listing.id}?step=3&bookingId=${bookingRes.bookingId}`);
          } catch (verifyError) {
            console.error("Payment verification failed:", verifyError);
            setErrorMessage(
              "Payment was made but verification failed. Please contact support with reference: " +
                initRes.reference
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
        // Expected business rejections - own listing, dates taken (409),
        // missing event location (400), session expired. Surface inline and
        // keep them out of console.error so the dev overlay stays quiet.
        setErrorMessage(error.message || "Could not start payment process.");
        if (error.status >= 500) {
          console.error("Payment initialization failed:", error);
        }
      } else {
        console.error("Payment initialization failed:", error);
        setErrorMessage("An unexpected error occurred. Please check your network and try again.");
      }
      setIsProcessing(false);
    }
  };

  const days = quote?.days;
  const dayWord = days === 1 ? "day" : "days";
  const hireLabel = selectedPackage
    ? `${selectedPackage.name} × ${days ?? "…"} ${dayWord}`
    : `${isService ? "Service fee" : "Venue hire"} × ${days ?? "…"} ${dayWord}`;

  const paymentSummary: PaymentSummaryData = {
    venueName: listing.title,
    venueLocation: eventLocationText,
    venueImage: listing.primaryImage?.url || listing.images[0]?.url || FALLBACK_IMAGE,
    eventName: isService ? selectedPackage?.name ?? "Service booking" : "Venue booking",
    eventDateLabel: formatDateRangesLabel(form.dateRanges),
    eventTimeLabel: `${form.startTime} – ${form.endTime}`,
    guests: isService ? undefined : `${form.guests.toLocaleString()} expected`,
    kind: listing.kind,
    locationLabel: isService ? "Event location" : "Venue address",
    verified: listing.autoApprove,
    fees: quote
      ? [
          { label: hireLabel, value: naira(quote.subtotal), sublabel: "per-day rate" },
          { label: "VAT (7.5%)", value: naira(quote.vat) },
        ]
      : [],
    total: quote ? naira(quote.total) : "Calculating…",
    totalNote: excluded.length
      ? `Includes VAT · ${excluded.length} removed ${excluded.length === 1 ? "day" : "days"} not charged`
      : "Includes VAT · held in escrow until your event",
  };

  //  Post-payment transition 
  if (isRedirecting) {
    return (
      <section className={mobile ? "px-6 pb-32 pt-10" : "mx-auto max-w-3xl px-8 py-24"}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="flex flex-col items-center rounded-4xl bg-white px-6 py-14 text-center shadow-[0_20px_44px_rgba(34,27,18,0.07)]"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F3EC] text-[#2D5A27]">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-xl font-extrabold text-[#252423] md:text-2xl">
            Payment confirmed
          </h2>
          <p className="mt-2 max-w-sm text-sm font-semibold text-[#5E6588]">
            Preparing your booking confirmation…
          </p>
          <span
            className="mt-6 h-6 w-6 animate-spin rounded-full border-2 border-[#B9401D]/25 border-t-[#B9401D]"
            aria-hidden="true"
          />
        </motion.div>
      </section>
    );
  }

  //  Deep-link protection 
  // ?step=2 with an incomplete selection can never reach checkout.
  if (missing.length > 0) {
    return (
      <section className={mobile ? "px-6 pb-32 pt-8" : "mx-auto max-w-3xl px-8 py-20"}>
        <div className="rounded-4xl bg-white p-7 shadow-[0_20px_44px_rgba(34,27,18,0.07)] md:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1E6] text-[#B9401D]">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-extrabold text-[#252423]">
            Let&apos;s finish your booking details
          </h2>
          <p className="mt-2 text-sm font-semibold text-[#5E6588]">
            We still need a few things before payment can open.
          </p>
          <ul className="mt-5 space-y-2">
            {missing.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 rounded-2xl bg-[#F7F2EA] px-4 py-3 text-sm font-bold text-[#3A3734]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B9401D]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => wizard.goToStep(1)}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#B9401D] px-7 py-3.5 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to booking details
          </button>
        </div>
      </section>
    );
  }

  const notices = (
    <>
      {infoMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-3 rounded-2xl border border-[#E8DDD2] bg-[#F7F2EA] p-4 text-sm font-semibold text-[#5E6588]"
        >
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
          <p>{infoMessage}</p>
        </motion.div>
      )}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-2xl border border-[#F3C9BC] bg-[#FDF1EC] p-4 text-sm font-semibold text-[#8A3A1C]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </motion.div>
      )}
    </>
  );

  if (mobile) {
    return (
      <section className="px-5 pb-44">
        <h1 className="text-2xl font-extrabold text-[#252423]">Review &amp; pay</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#5E6588]">
          Your dates are held only while the secure payment popup is open — close it and they&apos;re
          released instantly. Payment stays in escrow until the vendor confirms.
        </p>

        <HoldCountdown expiresAt={holdExpiresAt} className="mt-5" />
        {notices}

        <div className="mt-6 space-y-2.5">
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#F7F2EA] px-4 py-3 text-xs font-extrabold text-[#3A3734]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            256-bit encrypted checkout · we never store your card
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#F7F2EA] px-4 py-3 text-xs font-extrabold text-[#3A3734]">
            <LockKeyhole className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            Full refund if the vendor doesn&apos;t confirm in 24 hours
          </div>
        </div>

        <button
          type="button"
          onClick={() => wizard.goToStep(1)}
          className="mt-6 inline-flex items-center gap-1.5 text-small font-extrabold text-[#555B7F]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Edit booking details
        </button>

        <MobilePaymentDock
          summary={paymentSummary}
          onPay={handlePay}
          isProcessing={wizard.isProcessing}
          holdExpiresAt={holdExpiresAt}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-8 py-14 lg:grid-cols-[minmax(0,1fr)_29rem]">
      <div>
        <h1 className="text-4xl font-extrabold tracking-[-0.02em] text-[#252423]">
          Review &amp; pay
        </h1>
        <p className="mt-3 max-w-xl text-lg leading-8 text-[#5E6588]">
          Tap Pay to open our secure payment popup. Your dates are held only while it&apos;s open —
          close it and they&apos;re released instantly. Payment is held in escrow until the vendor
          confirms.
        </p>

        <HoldCountdown expiresAt={holdExpiresAt} className="mt-5" />
        {notices}

        <div className="mt-8 rounded-4xl bg-[#F4F1EA] p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#B9401D] shadow-sm">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-[#252423]">Secure backend processing</h3>
              <p className="mt-1 text-sm leading-6 text-[#5E6588]">
                We do not store your card details. Every transaction is processed by Paystack, and
                your money sits in escrow until your event is delivered.
              </p>
            </div>
          </div>
        </div>

        <SecuritySignals />

        <button
          type="button"
          onClick={() => wizard.goToStep(1)}
          className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-[#555B7F] transition-colors hover:text-[#252423]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Edit booking details
        </button>
      </div>

      <PaymentSummary
        summary={paymentSummary}
        onPay={handlePay}
        isProcessing={wizard.isProcessing}
        holdExpiresAt={holdExpiresAt}
      />
    </section>
  );
}
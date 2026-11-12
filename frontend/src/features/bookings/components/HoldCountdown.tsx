"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, TimerOff } from "lucide-react";

interface HoldCountdownProps {
  /** ISO timestamp from POST /api/bookings (`expiresAt`). Null - renders nothing. */
  expiresAt: string | null | undefined;
  /** Fires exactly once when the countdown reaches zero. */
  onExpired?: () => void;
  className?: string;
}

const URGENT_THRESHOLD_MS = 5 * 60 * 1000;

function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Ticketmaster-style checkout hold timer.
 * The hold itself lives server-side (the pending booking row); this is a
 * pure read-only view of its `expires_at`. Expiry here needs no API call -
 * the backend already treats the hold as dead the instant it lapses.
 */
export default function HoldCountdown({ expiresAt, onExpired, className = "" }: HoldCountdownProps) {
  // null until mounted - server and first client render agree (no mismatch).
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const firedRef = useRef(false);
  const onExpiredRef = useRef(onExpired);

  // Sync the callback into a ref so an inline lambda from the parent never
  // tears down and restarts the interval.
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    firedRef.current = false;

    if (!expiresAt) {
      setRemainingMs(null);
      return;
    }
    const target = new Date(expiresAt).getTime();
    if (Number.isNaN(target)) {
      setRemainingMs(null);
      return;
    }

    let interval: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      const ms = Math.max(0, target - Date.now());
      setRemainingMs(ms);
      if (ms <= 0) {
        if (interval) clearInterval(interval);
        if (!firedRef.current) {
          firedRef.current = true;
          onExpiredRef.current?.();
        }
      }
    };

    tick();
    if (target - Date.now() > 0) interval = setInterval(tick, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expiresAt]);

  if (!expiresAt || remainingMs === null) return null;

  // Expired: the dates are already released server-side. Retrying Pay is
  // always safe - it creates a fresh hold (or reuses a live one).
  if (remainingMs <= 0) {
    return (
      <div
        role="status"
        className={`flex items-start gap-2.5 rounded-2xl border border-[#E8DDD2] bg-[#F7F2EA] px-4 py-3 ${className}`}
      >
        <TimerOff className="mt-0.5 h-4 w-4 shrink-0 text-[#5E6588]" aria-hidden="true" />
        <p className="text-xs font-semibold leading-5 text-[#5E6588]">
          Your date hold expired and the dates were released. Tap{" "}
          <span className="font-extrabold text-[#252423]">Pay Now</span> to start a fresh
          30-minute hold.
        </p>
      </div>
    );
  }

  const urgent = remainingMs <= URGENT_THRESHOLD_MS;

  return (
    <div
      role="timer"
      aria-label={`Dates held for you. ${formatRemaining(remainingMs)} remaining to complete payment.`}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${
        urgent ? "bg-[#FFF1E6] text-[#B9401D]" : "bg-[#F4F1EA] text-[#252423]"
      } ${className}`}
    >
      <Clock3 className={`h-3.5 w-3.5 shrink-0 ${urgent ? "animate-pulse" : ""}`} aria-hidden="true" />
      <span className="text-xs font-bold">Dates held for you</span>
      <span className="text-xs font-extrabold tabular-nums">{formatRemaining(remainingMs)}</span>
    </div>
  );
}
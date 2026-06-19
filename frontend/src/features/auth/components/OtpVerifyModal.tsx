"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { XIcon } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { VerifyResetOtpResponse } from "../auth.types";
// import { AuthUser } from "@/types/auth";

const CODE_LENGTH = 6;

// interface OtpVerifyModalProps {
//   email: string;
//   /** ISO timestamp for when the current code expires — drives the countdown. */
//   expiresAt: string;
//   open: boolean;
//   onClose: () => void;
//   onVerified: (sessionToken: string) => void;
// }

interface OtpVerifyModalProps {
  email: string;
  expiresAt: string;
  open: boolean;
  onClose: () => void;

  onVerify: (code: string) => Promise<void>;

  onResend: () => Promise<{
    expiresAt: string;
  }>;
}

function useCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function OtpVerifyModal({
  email,
  expiresAt,
  open,
  onClose,
  // onVerified,
  onVerify,
  onResend,
}: OtpVerifyModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentExpiresAt, setCurrentExpiresAt] = useState(expiresAt);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const secondsLeft = useCountdown(currentExpiresAt);
  const expired = secondsLeft <= 0;

  const lockSecondsLeft = useCountdown(lockedUntil);
  const locked = !!lockedUntil && lockSecondsLeft > 0;

  // reset internal state whenever the modal is (re)opened for a fresh request
  useEffect(() => {
    if (open) {
      setDigits(Array(CODE_LENGTH).fill(""));
      setError(null);
      setCurrentExpiresAt(expiresAt);
      setLockedUntil(null);
      const t = setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, expiresAt]);

  // resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // escape to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 420);
  };

  // const verifyCode = useCallback(
  //   async (code: string) => {
  //     setVerifying(true);
  //     setError(null);
  //     try {
  //       const response = await apiFetch<VerifyResetOtpResponse>("/api/auth/verify-reset-otp", {
  //         method: "POST",
  //         body: JSON.stringify({ email, code }),
  //         redirectOn401: false,
  //       });
  //       onVerified(response.sessionToken);
  //     } catch (err) {
  //       if (err instanceof ApiError) {
  //         const data = err.data as
  //           | { error?: string; attemptsRemaining?: number; lockedUntil?: string }
  //           | undefined;

  //         if (data?.lockedUntil) {
  //           setLockedUntil(data.lockedUntil);
  //           setError("Too many incorrect attempts. Try again later.");
  //         } else if (typeof data?.attemptsRemaining === "number") {
  //           setError(
  //             data.attemptsRemaining > 0
  //               ? `Incorrect code. ${data.attemptsRemaining} attempt${data.attemptsRemaining === 1 ? "" : "s"} left.`
  //               : "Incorrect code."
  //           );
  //         } else {
  //           setError(data?.error ?? "Invalid or expired code.");
  //         }
  //       } else {
  //         setError("Something went wrong. Please try again.");
  //       }

  //       triggerShake();
  //       setDigits(Array(CODE_LENGTH).fill(""));
  //       inputRefs.current[0]?.focus();
  //     } finally {
  //       setVerifying(false);
  //     }
  //   },
  //   [email, onVerified]
  // );
  const verifyCode = useCallback(
  async (code: string) => {
    setVerifying(true);
    setError(null);

    try {
      await onVerify(code);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Invalid or expired code.");
      }

      triggerShake();
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  },
  [onVerify]
);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");

    if (!value) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    // value may contain more than one char on some mobile keyboards/autofill
    const chars = value.split("");
    setDigits((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const char of chars) {
        if (cursor >= CODE_LENGTH) break;
        next[cursor] = char;
        cursor += 1;
      }
      const nextFocus = Math.min(cursor, CODE_LENGTH - 1);
      requestAnimationFrame(() => inputRefs.current[nextFocus]?.focus());

      if (next.every((d) => d !== "") && next.join("").length === CODE_LENGTH) {
        verifyCode(next.join(""));
      }
      return next;
    });
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setDigits(next);

    const lastFilled = Math.min(pasted.length, CODE_LENGTH) - 1;
    requestAnimationFrame(() => inputRefs.current[Math.max(lastFilled, 0)]?.focus());

    if (pasted.length === CODE_LENGTH) {
      verifyCode(pasted);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      // const response = await apiFetch<{ message: string; expiresAt: string }>(
      //   "/api/auth/forgot-password",
      //   {
      //     method: "POST",
      //     body: JSON.stringify({ email }),
      //     redirectOn401: false,
      //   }
      // );
      const response = await onResend();

      setCurrentExpiresAt(response.expiresAt);
      setCurrentExpiresAt(response.expiresAt);
      setDigits(Array(CODE_LENGTH).fill(""));
      setLockedUntil(null);
      setResendCooldown(30);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Couldn't resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (!open) return null;

  const disabled = verifying || locked;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#221B12]/40 px-4 backdrop-blur-[2px] animate-[fadeIn_0.18s_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-modal-title"
        className={`relative w-full max-w-110 rounded-[2rem] bg-white px-6 py-9 shadow-[0_30px_80px_rgba(34,27,18,0.22)] md:px-10 md:py-11 ${
          shake ? "animate-[shake_0.42s_ease-in-out]" : "animate-[scaleIn_0.22s_ease-out]"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-[#6B5F57] transition hover:bg-[#F7F2EA]"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h2 id="otp-modal-title" className="text-2xl font-extrabold tracking-[-0.03em] md:text-[1.75rem]">
            Confirm your code
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#555B7F] md:text-[0.95rem]">
            Enter the 6-digit code we sent to
            <br />
            <span className="font-semibold text-[#221B12]">{email}</span>
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-2 md:gap-3" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={CODE_LENGTH}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              className={`h-13 w-10 rounded-2xl border-2 text-center text-xl font-bold text-[#221B12] outline-none transition md:h-14 md:w-12 ${
                error
                  ? "border-[#B9401D]/60 bg-[#FBEFEA]"
                  : "border-[#EFE8DE] bg-[#FAF7F2] focus:border-[#B9401D] focus:bg-white"
              } disabled:opacity-50`}
            />
          ))}
        </div>

        <div className="mt-5 min-h-5 text-center">
          {error ? (
            <p className="text-sm font-semibold text-[#B9401D]">{error}</p>
          ) : verifying ? (
            <p className="text-sm font-semibold text-[#555B7F]">Verifying...</p>
          ) : null}
        </div>

        <div className="mt-2 text-center">
          {locked ? (
            <p className="text-sm text-[#555B7F]">
              Try again in <span className="font-semibold text-[#221B12]">{formatTime(lockSecondsLeft)}</span>
            </p>
          ) : expired ? (
            <p className="text-sm font-semibold text-[#B9401D]">Code expired</p>
          ) : (
            <p className="text-sm text-[#555B7F]">
              Code expires in{" "}
              <span className="font-semibold text-[#221B12]">{formatTime(secondsLeft)}</span>
            </p>
          )}
        </div>

        <div className="mt-7 border-t border-[#EFE8DE] pt-6 text-center">
          <p className="text-sm text-[#555B7F]">
            Didn&apos;t get a code?{" "}
            {resendCooldown > 0 ? (
              <span className="font-semibold text-[#A39A8F]">Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-[#B9401D] underline-offset-2 hover:underline disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend"}
              </button>
            )}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-6px);
          }
          40%,
          80% {
            transform: translateX(6px);
          }
        }
      `}</style>
    </div>
  );
}
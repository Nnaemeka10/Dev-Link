"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BOOKING_STORAGE_KEY, DEFAULT_BOOKING_FORM } from "../booking.data";
import type { BookingFormState } from "../booking.types";

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

    const dateRange = parsed.dateRange
      ? {
          from: new Date(parsed.dateRange.from),
          to: parsed.dateRange.to
            ? new Date(parsed.dateRange.to)
            : undefined,
        }
      : undefined;

    return { ...DEFAULT_BOOKING_FORM, ...parsed, dateRange };
  } catch {
    return DEFAULT_BOOKING_FORM;
  }
}

export function useBookingWizard(maxStep: number) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = clampStep(Number(searchParams.get("step") ?? "1"), maxStep);
  const [form, setForm] = useState<BookingFormState>(() => readStoredForm());

  useEffect(() => {
    // Provision for production inventory locking:
    // create or refresh a server-side "draft booking" here so selected dates
    // can be temporarily held while the user completes payment.
  }, []);

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
    }),
    [maxStep, pathname, router]
  );

  return {
    ...actions,
    form,
    step,
  };
}

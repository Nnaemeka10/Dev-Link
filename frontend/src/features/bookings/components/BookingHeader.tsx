"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle, LockKeyhole, X } from "lucide-react";

export function DesktopBookingHeader({ checkout = false }: { checkout?: boolean }) {
  const router = useRouter();
  return (
    <header className="flex h-20 items-center justify-between px-8 lg:px-12">
      <Link
        href="/"
        className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#555B7F] transition-colors hover:text-[#252423]"
      >
        EventVnV
      </Link>
      <div className="flex items-center gap-4">
        {checkout && (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F1EA] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">
            <LockKeyhole className="h-3.5 w-3.5 text-[#B9401D]" aria-hidden="true" />
            Secure checkout
          </span>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Leave checkout"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#555B7F] transition-colors hover:bg-[#F4F1EA] hover:text-[#252423]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export function MobileBookingHeader({ activestep }: { activestep: number }) {
  const router = useRouter();
  // Step 3 is terminal: "close" lands on the bookings hub, never on a
  // half-built /listings/:id URL (that route needs the halls/services segment).
  const isFinal = activestep >= 3;
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-bg-primary/95 px-5 backdrop-blur">
      <button
        type="button"
        aria-label={isFinal ? "Close and view my bookings" : "Go back"}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#B9401D] transition-colors hover:bg-[#F4F1EA]"
        onClick={() => (isFinal ? router.push("/saved?tab=bookings") : router.back())}
      >
        {isFinal ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
      </button>

      <h1 className="text-lg font-extrabold text-[#252423]">
        {isFinal ? "Booking" : "Secure booking"}
      </h1>

      <Link
        href="/help/bookings-and-payments"
        aria-label="Booking help"
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#B9401D] transition-colors hover:bg-[#F4F1EA]"
      >
        <HelpCircle className="h-5 w-5" />
      </Link>
    </header>
  );
}
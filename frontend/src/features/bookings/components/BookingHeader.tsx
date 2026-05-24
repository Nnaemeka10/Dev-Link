import { ArrowLeft, Briefcase, MessageSquare, MoreVertical, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function DesktopBookingHeader({ checkout = false }: { checkout?: boolean }) {
  return (
    <header className="flex h-20 items-center px-8 lg:px-12">
      <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
            <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
            <p className="font-semibold logo translate-y-1.5">EventVnV </p>
      </Link>
      {checkout && (
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#555B7F]">Secure Checkout</span>
          <X className="h-5 w-5" />
        </div>
      )}
    </header>
  );
}

export function MobileBookingHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-bg-primary px-6">
      <button type="button" aria-label="Back" className="text-[#B9401D]">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-extrabold text-[#252423]">Secure Booking</h1>
      <button type="button" aria-label="More options" className="text-[#B9401D]">
        <MoreVertical className="h-5 w-5" />
      </button>
    </header>
  );
}

export function BookingNavHeader() {
  return (
    <header className="flex h-20 items-center px-8 lg:px-12">
      <h1 className="text-2xl font-extrabold text-[#252423]">Eventvnv</h1>
      <nav className="mx-auto flex items-center gap-8 text-base font-semibold text-[#555B7F]">
        <button type="button">Venues</button>
        <button type="button">Vendors</button>
        <button type="button">Inspiration</button>
        <button type="button" className="border-b-2 border-[#B9401D] pb-2 font-extrabold text-[#B9401D]">
          My Bookings
        </button>
      </nav>
      <div className="flex items-center gap-5 text-[#555B7F]">
        <Briefcase className="h-5 w-5" />
        <ShoppingBag className="h-5 w-5" />
      </div>
    </header>
  );
}

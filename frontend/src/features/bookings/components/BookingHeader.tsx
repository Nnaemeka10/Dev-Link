import { ArrowLeft, Briefcase, MessageSquare, MoreVertical, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export function DesktopBookingHeader({ checkout = false }: { checkout?: boolean }) {
  return (
    <header className="flex h-20 items-center px-8 lg:px-12">
      {checkout && (
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#555B7F]">Secure Checkout</span>
          <X className="h-5 w-5" />
        </div>
      )}
    </header>
  );
}

export function MobileBookingHeader({ activestep }: { activestep: number }) {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-bg-primary px-6">
      <button type="button" aria-label="Back" className="text-[#B9401D]" onClick={() => activestep === 3 ? router.push(`/listings/${id}`) : router.back()}>
        {activestep === 3 ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
      </button>
      <h1 className="text-lg font-extrabold text-[#252423]">Secure Booking</h1>
      <button type="button" aria-label="More options" className="text-[#B9401D]">
        <MoreVertical className="h-5 w-5" />
      </button>
    </header>
  );
}



"use client";

import Image from "next/image";
import { Building, CalendarDays, Check, Clock, FileText, Mail, MapPin, MessageSquare, Phone, UsersRound } from "lucide-react";
import { createConversation } from "@/features/chat/chat.api";
import { useRouter } from "next/navigation";

import type { useBookingWizard } from "../hooks/useBookingWizard";

interface ConfirmationStepProps {
  wizard: ReturnType<typeof useBookingWizard>;
  variant?: "desktop" | "mobile";
}

export default function ConfirmationStep({wizard, variant = "desktop" }: ConfirmationStepProps) {
  const booking = wizard.bookingDetails;

  const router = useRouter();

  const handleChatWithVendor = async () => {
  if (!booking) return;
  try {
    // The booking conversation was already created by the backend during markAsPaid.
    // We just need to find it. We can use the createConversation endpoint 
    // which is idempotent, but we need to pass the bookingId.
    // For simplicity, we'll just push them to the chat inbox, and the conversation will be at the top.
    router.push(`/chat`);
  } catch (error) {
    console.error("Failed to open chat", error);
  }
};

  if (wizard.isBookingLoading || !booking) {
    return <div className="min-h-screen flex items-center justify-center">Loading confirmation...</div>;
  }

  const vendorName = `${booking.vendor_first_name || ''} ${booking.vendor_last_name || ''}`.trim() || booking.vendor_email || "Vendor";

  const parseDateSafe = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const eventDate = parseDateSafe(booking.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const eventTime = `${booking.start_time || '00:00'} - ${booking.end_time || '00:00'}`;
  const totalAmount = parseFloat(booking.total_amount.toString()).toLocaleString();  
  const bookingStatus = booking.status === 'confirmed' ? 'Confirmed' : 'Pending Approval';

  // const gallery = listing.images.map((img) => img.url);
  // const venueImage = listing.primaryImage?.url || gallery[0] || "/images/placeholder.jpg";


  if (variant === "mobile") {
    return (
      <section className="px-6 pb-28 text-center">
        <div className="mx-auto mt-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#B9401D] text-white shadow-[0_24px_44px_rgba(185,64,29,0.22)]">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="mt-8 text-3xl font-extrabold">Booking Confirmed!</h1>
        <p className="mt-3 text-lg text-[#555B7F]">Your event reservation is now secured.</p>

        <div className="mt-10 mb-32 rounded-4xl bg-[#F4F1EA] p-6 text-left">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Event Summary</p>
          <div className="mt-6 space-y-6">
            <SummaryRow icon={Building} label="Venue" value={`${booking.listing_title}`} />
            <SummaryRow icon={MapPin} label="Location" value={booking.listing_location} />
             <SummaryRow icon={CalendarDays} label="Date & Time" value={`${eventDate} · ${eventTime}`} />
            <SummaryRow icon={UsersRound} label="Capacity" value={`Up to ${booking.listing_capacity || 'N/A'} Guests`} />
            <SummaryRow icon={Clock} label="Check-in" value="Ensure to check into the venue on time" />
            
          </div>
        </div>


        <div className="fixed inset-x-0 bottom-20 z-40 bg-white px-6 py-5 shadow-[0_-12px_32px_rgba(34,27,18,0.08)]">
          <button type="button" className="w-full rounded-full bg-[#B9401D] px-8 py-4 font-extrabold text-white flex items-center justify-center gap-2"><FileText /> View My Bookings</button>
          <button type="button" className="w-full mt-5 font-extrabold text-[#555B7F] flex items-center justify-center gap-2" onClick={handleChatWithVendor}>
            <Mail /> Chat with Vendor
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-8 py-14">
      <div className="text-center">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#F1E1DA] text-[#B9401D]">
          <Check className="h-9 w-9" />
        </div>
        <h1 className="mt-8 text-5xl font-extrabold">Booking Confirmed!</h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-[#555B7F]">
          Your reservation at {booking.listing_title} has been secured. A confirmation has been sent to your email.
        </p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <article className="rounded-4xl bg-white p-10 shadow-[0_20px_44px_rgba(34,27,18,0.07)]">
          <h2 className="text-2xl font-extrabold">Booking Details</h2>
          <div className="mt-6 border-t border-[#E8DED2] pt-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Venue</p>
                <h3 className="mt-2 text-xl font-extrabold">{booking.listing_title}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#555B7F]">
                  <MapPin className="h-4 w-4" /> {booking.listing_location}
                </p>
              </div>
              <Image src={booking.listing_image || "images/placeholder.jpg"} alt={booking.listing_title} height={96} width={96} className="h-24 w-24 rounded-[1.4rem] object-cover" />
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <SummaryText label="Date" value={eventDate} />
              <SummaryText label="Time" value={eventTime} />
              <SummaryText label="Capacity" value={`Up to ${booking.listing_capacity || 'N/A'} Guests`} />
              <SummaryText label="Total Paid" value={`₦${totalAmount}`} />
              <SummaryText label="Status" value={bookingStatus} badge />
            </div>
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#FFF4EE] p-4 text-sm text-[#B9401D]">
              <Clock className="h-5 w-5 shrink-0" />
              <p className="font-semibold">Ensure to check into the venue on time.</p>
            </div>
          </div>
        </article>

        <aside className="rounded-4xl bg-[#E8E4DC] p-10">
          <h2 className="text-xl font-medium">Vendor Contact</h2>
           <p className="mt-8 text-sm text-[#6B5F57]">You can message the vendor directly regarding your event specifics.</p>

         
          <div className="mt-8 flex items-center gap-4">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl">{vendorName.charAt(0).toUpperCase()}</span>
            <div>
              <h3 className="font-extrabold">{vendorName}</h3>
              <p className="text-sm text-[#555B7F]">Event Manager</p>
            </div>
          </div> 
          {booking.vendor_email && <p className="mt-8 flex items-center gap-3 text-sm text-[#6B5F57]"><Mail className="h-4 w-4 text-[#B9401D]" /> {booking.vendor_email}</p>}
          {booking.vendor_phone && <p className="mt-5 flex items-center gap-3 text-sm text-[#6B5F57]"><Phone className="h-4 w-4 text-[#B9401D]" /> {booking.vendor_phone}</p>}

          
          <button type="button" className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-extrabold text-[#B9401D]">
            <MessageSquare className="h-4 w-4" />
            Chat with Vendor
          </button>
        </aside>
      </div>

      {/* include this service contact later */}
      {/* <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <article className="rounded-[2rem] border border-[#EAD0C6] bg-[#FFF4EE] p-10">
          <div className="flex items-start gap-5">
            <FileText className="h-6 w-6 text-[#B9401D]" />
            <div>
              <h2 className="text-2xl font-extrabold">Service Contract</h2>
              <p className="mt-5 max-w-xl leading-7 text-[#555B7F]">Please review and digitally sign the finalized service agreement to complete your onboarding process with the vendor.</p>
              <button type="button" className="mt-8 rounded-full bg-[#B9401D] px-10 py-4 font-extrabold text-white">Sign/Confirm Contract</button>
            </div>
          </div>
        </article>
        <Image src={BOOKING_GALLERY_IMAGE} alt="Venue map preview" className="h-48 w-full rounded-[2rem] object-cover opacity-70" />
      </div> */}
    </section>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8E4DC] text-[#B9401D]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-medium text-[#555B7F]">{label}</p>
        <p className="font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function SummaryText({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">{label}</p>
      {badge ? (
        <span className="mt-2 inline-flex rounded-full bg-[#FFC65C] px-4 py-1 text-xs font-extrabold">{value}</span>
      ) : (
        <p className="mt-2 text-lg">{value}</p>
      )}
    </div>
  );
}

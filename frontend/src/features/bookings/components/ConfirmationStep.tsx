"use client";

import Image from "next/image";
import { CalendarDays, Check, FileText, Mail, MapPin, MessageSquare, Phone, UsersRound } from "lucide-react";
import { BOOKING_GALLERY_IMAGE, BOOKING_VENUE, HOST_CONTACT } from "../booking.data";

export default function ConfirmationStep({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  if (variant === "mobile") {
    return (
      <section className="px-6 pb-28 text-center">
        <div className="mx-auto mt-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#B9401D] text-white shadow-[0_24px_44px_rgba(185,64,29,0.22)]">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="mt-8 text-3xl font-extrabold">Booking Confirmed!</h1>
        <p className="mt-3 text-lg text-[#555B7F]">Your event reservation is now secured.</p>

        <div className="mt-10 rounded-[2rem] bg-[#F4F1EA] p-6 text-left">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Event Summary</p>
          <div className="mt-6 space-y-6">
            <SummaryRow icon={MapPin} label="Venue" value={`${BOOKING_VENUE.name}, Victoria Island`} />
            <SummaryRow icon={CalendarDays} label="Date & Time" value="December 15, 2024 · 4:00 PM" />
            <SummaryRow icon={UsersRound} label="Guests" value="Up to 250 Attendees" />
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white mb-36 p-6 text-left shadow-[0_16px_36px_rgba(34,27,18,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold">Amina Okoro</h2>
              <p className="text-sm text-[#555B7F]">Venue Manager</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-full bg-[#FFC65C] px-5 py-3 font-extrabold text-[#6F4A00]">
              <MessageSquare className="h-4 w-4" />
              Chat
            </button>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-20 z-40 bg-white px-6 py-5 shadow-[0_-12px_32px_rgba(34,27,18,0.08)]">
          <button type="button" className="w-full rounded-full bg-[#B9401D] px-8 py-4 font-extrabold text-white">View My Bookings →</button>
          <button type="button" className="mt-5 font-extrabold text-[#555B7F]">Chat with Vendor</button>
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
          Your reservation at The Grand Atrium has been secured. An editorial confirmation has been sent to your email.
        </p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <article className="rounded-[2rem] bg-white p-10 shadow-[0_20px_44px_rgba(34,27,18,0.07)]">
          <h2 className="text-2xl font-extrabold">Booking Details</h2>
          <div className="mt-6 border-t border-[#E8DED2] pt-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#555B7F]">Venue</p>
                <h3 className="mt-2 text-xl font-extrabold">{BOOKING_VENUE.name}</h3>
              </div>
              <Image src={BOOKING_VENUE.image} alt={BOOKING_VENUE.name} className="h-24 w-24 rounded-[1.4rem] object-cover" />
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <SummaryText label="Date" value="Saturday, Dec 14, 2024" />
              <SummaryText label="Time" value="06:00 PM — 11:00 PM" />
              <SummaryText label="Guests" value="250 Attendees" />
              <SummaryText label="Status" value="Secured" badge />
            </div>
          </div>
        </article>

        <aside className="rounded-[2rem] bg-[#E8E4DC] p-10">
          <h2 className="text-xl font-medium">Vendor Contact</h2>
          <div className="mt-8 flex items-center gap-4">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl">A</span>
            <div>
              <h3 className="font-extrabold">{HOST_CONTACT.name}</h3>
              <p className="text-sm text-[#555B7F]">{HOST_CONTACT.role}</p>
            </div>
          </div>
          <p className="mt-8 flex items-center gap-3 text-sm text-[#6B5F57]"><Mail className="h-4 w-4 text-[#B9401D]" /> {HOST_CONTACT.email}</p>
          <p className="mt-5 flex items-center gap-3 text-sm text-[#6B5F57]"><Phone className="h-4 w-4 text-[#B9401D]" /> {HOST_CONTACT.phone}</p>
          <button type="button" className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-extrabold text-[#B9401D]">
            <MessageSquare className="h-4 w-4" />
            Chat with Vendor
          </button>
        </aside>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
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
      </div>
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

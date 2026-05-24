"use client";

import { MapPin, MessageSquare, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { GRAND_ATRIUM_DETAILS } from "../details.data";
import { BOOKING_STORAGE_KEY } from "@/features/bookings/booking.data";
import BookingCard from "../components/details/BookingCard";
import { DetailsActions, MobileDetailsHeader, TabletDetailsHeader } from "../components/details/DetailsHeader";
import DetailsFooter from "../components/details/DetailsFooter";
import { ListingBadge, RatingBadge, VerifiedVenueBadge } from "../components/details/DetailBadges";
import ListingFeatures from "../components/details/ListingFeatures";
import { DesktopPhotoGallery, MobileHeroPhoto, TabletPhotoGallery } from "../components/details/PhotoGallery";
import ReviewsSection from "../components/details/ReviewsSection";
import SimilarVenues from "../components/details/SimilarVenues";
import SideNavBar from "../components/SideNavBar";
import { DesktopExploreHeader } from "../components/explore/DesktopExploreHeader";
import { useSearchForm } from "@/features/search";
import { buildListingsHref } from "../searchParams";
import { SearchFormData } from "@/features/search/utils/searchSchema";
import ExploreFooter from "../components/explore/ExploreFooter";
import type { DateRange } from "@/features/search/utils/searchSchema";
import Link from "next/link";
import Image from "next/image";

interface SearchProps {
  handleSearch: (data: SearchFormData) => void;
  form: ReturnType<typeof useSearchForm>;
  isPending: boolean;
}

interface DesktopDetailsViewProps extends SearchProps {
  booking: ReturnType<typeof useBookingState>;
}

function useBookingState() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState("Up to 500");
  const [time, setTime] = useState("Evening");
  const [booked, setBooked] = useState(false);

  return {
    booked,
    dateRange,
    guests,
    time,
    bookNow: () => {
      // Persist booking selection to localStorage so wizard can load it
      const bookingPayload = { dateRange, guests, time };
      try {
        localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingPayload));
      } catch (error) {
        console.error("Failed to save booking to localStorage:", error);
      }

      setBooked(true);
      router.push("/bookings/grand-atrium?step=1");
    },
    setDateRange,
    setGuests,
    setTime,
  };
}

function AboutCopy({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "mt-6" : "py-9"}>
      <h2 className="text-xl font-medium text-[#3A3734]">{compact ? "" : "An Editorial Marvel in Victoria Island"}</h2>
      <div className="mt-4 space-y-5 text-base font-medium leading-8 text-[#5E6588]">
        {GRAND_ATRIUM_DETAILS.description.map((paragraph, index) => (
          <p key={paragraph} className={compact && index > 0 ? "hidden" : ""}>
            {compact ? `${paragraph.slice(0, 205)}...` : paragraph}
          </p>
        ))}
      </div>
      <button type="button" className="mt-4 text-sm font-extrabold text-[#B9401D]">
        Read more ›
      </button>
    </section>
  );
}

function MobileDetailsView({ booking }: { booking: ReturnType<typeof useBookingState> }) {
  const details = GRAND_ATRIUM_DETAILS;

  return (
    <section className="md:hidden">
      <MobileDetailsHeader />
      <MobileHeroPhoto image={details.gallery[0]} name={details.name} />

      <div className="relative z-10 -mt-12 px-5">
        <section className="rounded-[2rem] bg-white p-7 shadow-[0_20px_38px_rgba(36,28,18,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <VerifiedVenueBadge />
            <RatingBadge rating={details.rating} reviewsCount={details.reviewsCount} />
          </div>
          <h1 className="mt-4 text-[2rem] font-medium leading-tight text-[#252423]">{details.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5E6588]">
            <MapPin className="h-4 w-4" />
            {details.location}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {details.badges.map((badge) => (
              <ListingBadge key={badge}>{badge}</ListingBadge>
            ))}
          </div>
          <AboutCopy compact />
        </section>
      </div>

      <ListingFeatures features={details.features} variant="mobile" />

      <div className="px-5 pb-10">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-base font-extrabold text-[#252423]"
        >
          <MessageSquare className="h-5 w-5" />
          Chat with Vendor
        </button>
      </div>

      <ReviewsSection metrics={details.reviewMetrics} reviews={details.reviews} variant="mobile" />
      <SimilarVenues venues={details.similarVenues} variant="mobile" />

      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] bg-white px-5 py-4 shadow-[0_-16px_36px_rgba(36,28,18,0.1)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7B7E9B]">Investment</p>
            <p className="text-xl font-extrabold text-[#252423]">
              {details.price}
              <span className="text-xs font-bold text-[#5E6588]"> / day</span>
            </p>
          </div>
          <button
            type="button"
            onClick={booking.bookNow}
            className="rounded-full bg-[#B9401D] px-9 py-4 text-sm font-extrabold text-white"
          >
            {booking.booked ? "Booked" : "Book Now"}
          </button>
        </div>
      </div>
    </section>
  );
}

function TabletDetailsView({ booking, handleSearch, form, isPending }: DesktopDetailsViewProps) {
  const details = GRAND_ATRIUM_DETAILS;

  return (
    <section className="hidden md:block xl:hidden w-full">
      <header className="flex h-fit items-center justify-between bg-bg-primary">       
        <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isPending}  filter = {false}/>
      </header>

      <TabletPhotoGallery gallery={details.gallery} name={details.name} />

      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_20rem] gap-10 px-8 py-12">
        <div>
          <div className="flex items-start justify-between gap-8">
            <div>
              <h1 className="text-[2rem] font-extrabold text-[#252423]">{details.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5E6588]">
                <MapPin className="h-4 w-4" />
                {details.location}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <RatingBadge rating={details.rating} reviewsCount={details.reviewsCount} />
              <VerifiedVenueBadge />
            </div>
          </div>

          <div className="mt-7 flex gap-3">
            {details.badges.map((badge) => (
              <ListingBadge key={badge}>{badge}</ListingBadge>
            ))}
          </div>

          <AboutCopy />
          <ListingFeatures features={details.features} />
          <ReviewsSection metrics={details.reviewMetrics} reviews={details.reviews} />
        </div>

        <BookingCard
          booked={booking.booked}
          dateRange={booking.dateRange}
          guests={booking.guests}
          time={booking.time}
          onBook={booking.bookNow}
          onDateChange={booking.setDateRange}
          onGuestsChange={booking.setGuests}
          onTimeChange={booking.setTime}
          price={details.price}
        />
      </div>

      <div className="mx-auto max-w-5xl px-8">
        <SimilarVenues venues={details.similarVenues} />
      </div>
      <DetailsFooter />
    </section>
  );
}

function DesktopDetailsView({ booking, handleSearch, form, isPending }: DesktopDetailsViewProps) {
  const details = GRAND_ATRIUM_DETAILS;

  return (
    <section className="hidden xl:flex">
    
      <SideNavBar />
      <div className="ml-[15%] w-[85%] flex flex-col overflow-hidden">
        <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isPending}  filter = {false}/>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 pb-12 pt-10">
            <DesktopPhotoGallery gallery={details.gallery} name={details.name} />
            <div className="grid grid-cols-[minmax(0,1fr)_20rem] gap-20 pr-8 py-12">
              <div>
                <div className="flex items-start justify-between gap-8">
                  <div>
                    <h1 className="text-[2rem] font-extrabold text-[#252423]">{details.name}</h1>
                    <span className="flex gap-8"> 
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5E6588]">
                        <MapPin className="h-4 w-4" />
                        {details.location}
                      </p>
                      <DetailsActions />
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RatingBadge rating={details.rating} reviewsCount={details.reviewsCount} />
                    <VerifiedVenueBadge />
                  </div>
                </div>

                <div className="mt-7 flex gap-3">
                  {details.badges.map((badge) => (
                    <ListingBadge key={badge}>{badge}</ListingBadge>
                  ))}
                </div>

                <AboutCopy />
                <ListingFeatures features={details.features} />
                
              </div>

              <BookingCard
                booked={booking.booked}
                dateRange={booking.dateRange}
                guests={booking.guests}
                time={booking.time}
                onBook={booking.bookNow}
                onDateChange={booking.setDateRange}
                onGuestsChange={booking.setGuests}
                onTimeChange={booking.setTime}
                price={details.price}
              />
          </div>

        
            <ReviewsSection metrics={details.reviewMetrics} reviews={details.reviews} />
            <SimilarVenues venues={details.similarVenues} />
               
      </div>
    </div>
      <DetailsFooter />
    </div>
      
  
          
      
      {/* <DesktopDetailsHeader />
      <div className="mx-auto max-w-[90rem] px-8 pb-20">
        <div className="mt-5 flex items-end justify-between">
          <div>
            <h1 className="text-[3rem] font-extrabold leading-tight text-[#252423]">{details.name}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm font-extrabold text-[#252423]">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                {details.rating} <span className="text-[#5E6588] underline">({details.reviewsCount})</span>
              </span>
              <span>•</span>
              <span>Verified Venue</span>
              <span>•</span>
              <span className="underline">{details.location}</span>
            </div>
          </div>
          <DetailsActions />
        </div>

        <div className="mt-8">
          <DesktopPhotoGallery gallery={details.gallery} name={details.name} />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_22rem] gap-16 py-12">
          <div>
            <div className="flex gap-3">
              {details.badges.map((badge) => (
                <ListingBadge key={badge}>{badge}</ListingBadge>
              ))}
            </div>
            <AboutCopy />
            <ListingFeatures features={details.features} />
          </div>

          <BookingCard
            booked={booking.booked}
            date={booking.date}
            guests={booking.guests}
            time={booking.time}
            onBook={booking.bookNow}
            onDateChange={booking.setDate}
            onGuestsChange={booking.setGuests}
            onTimeChange={booking.setTime}
            price={details.price}
          />
        </div>

        <ReviewsSection metrics={details.reviewMetrics} reviews={details.reviews} />
        <SimilarVenues venues={details.similarVenues} />
      </div>
      <DetailsFooter /> */}
    </section>
  );
}

export default function ListingDetails() { 
  const booking = useBookingState();
  const [isPending, startTransition] = useTransition(); //
  const form = useSearchForm();
  const router = useRouter();

  const handleSearch = (data: SearchFormData) => {
        startTransition(() => {
          router.push(
            buildListingsHref({
              category: data.category,
              location: data.location || undefined,
              dateFrom: data.dateRange?.from?.toISOString(),
              dateTo: data.dateRange?.to?.toISOString(),
              capacity: data.capacity,
              role: data.role,
            })
          );
        });
      };

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <MobileDetailsView booking={booking} />
      <TabletDetailsView booking={booking} handleSearch={handleSearch} form={form} isPending={isPending} />
      <DesktopDetailsView booking={booking} handleSearch={handleSearch} form={form} isPending={isPending} />
    </main>
  );
}

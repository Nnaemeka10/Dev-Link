
"use client";

import { MapPin, MessageSquare } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import BookingCard from "../components/details/BookingCard";
import { DetailsActions, MobileDetailsHeader } from "../components/details/DetailsHeader";
import { ListingBadge, RatingBadge, VerifiedVenueBadge } from "../components/details/DetailBadges";
import ListingFeatures from "../components/details/ListingFeatures";
import { DesktopPhotoGallery, MobileHeroPhoto, TabletPhotoGallery } from "../components/details/PhotoGallery";
import ReviewsSection from "../components/details/ReviewsSection";
import SimilarVenues from "../components/details/SimilarVenues";
import SideNavBar from "../../../components/layout/SideNavBar";
import { DesktopExploreHeader } from "../components/explore/DesktopExploreHeader";
import { useSearchForm } from "@/features/search";
import { buildListingsHref } from "../searchParams";
import { SearchFormData } from "@/features/search/utils/searchSchema";
import type { DateRange } from "@/features/search/utils/searchSchema";
import HomeFooter from "@/components/layout/Footer";
import { MobileBookingDock } from "../components/details/MobileBookingDock.tsx";
import MobileDock from "@/components/layout/MobileDock";
import { BOOKING_STORAGE_KEY } from "@/features/bookings/booking.data";

import { useListingDetails } from "../hooks/useListingDetails";
import { useSimilarListings } from "../hooks/useSimilarListings";
import type { ListingDetailsResponse, ListingCardSmall } from "../details.types";
import { createConversation } from "@/features/chat/chat.api";


interface SearchProps {
  handleSearch: (data: SearchFormData) => void;
  form: ReturnType<typeof useSearchForm>;
  isPending: boolean;
}

interface DetailsViewProps extends SearchProps {
  booking: ReturnType<typeof useBookingState>;
  listing: ListingDetailsResponse;
  similarVenues: ListingCardSmall[] | undefined;
}

function useBookingState() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState("Up to 500");
  const [time, setTime] = useState("Evening");
  const [booked, setBooked] = useState(false);
  const params = useParams();
  const id = params.id as string;

  return {
    booked,
    dateRange,
    guests,
    time,
    bookNow: () => {
      const bookingPayload = { dateRange, guests, time };
      try {
        localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingPayload));
      } catch (error) {
        console.error("Failed to save booking to localStorage:", error);
      }
      setBooked(true);
      router.push(`/bookings/${id}?step=1`);
    },
    setDateRange,
    setGuests,
    setTime,
  };
}



function AboutCopy({ description, compact = false }: { description: string; compact?: boolean }) {
  return (
    <section className={compact ? "mt-6" : "py-9"}>
      <h2 className="text-xl font-medium text-[#3A3734]">{compact ? "" : "About this venue"}</h2>
      <div className="mt-4 space-y-5 md:text-base text-small font-medium leading-8 text-[#5E6588]">
        <p>{compact ? `${description.slice(0, 205)}...` : description}</p>
      </div>
      {compact && (
        <button type="button" className="mt-4 md:text-sm text-small font-extrabold text-[#B9401D]">
          Read more ›
        </button>
      )}
    </section>
  );
}




function MobileDetailsView({ booking, listing, similarVenues }: { booking: ReturnType<typeof useBookingState>; listing: ListingDetailsResponse; similarVenues: ListingCardSmall[] | undefined }) {
  const router = useRouter()

const handleChatWithVendor = async () => {
  try {
    const res = await createConversation(listing.id);
    router.push(`/messages?conversationId=${res.id}`);
  } catch (error) {
    console.error("Failed to start chat", error);
  }
};

  const gallery = listing.images.map((img) => img.url);

  return (
    <section className="md:hidden">
      <MobileDetailsHeader title = {listing.name}/>
      <MobileHeroPhoto image={gallery[0] || "/placeholder.jpg"} name={listing.title} />

      <div className="relative z-10 -mt-12 px-5">
        <section className="rounded-4xl bg-white p-7 shadow-[0_20px_38px_rgba(36,28,18,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <VerifiedVenueBadge />
            <RatingBadge rating={listing.rating.toFixed(1)} reviewsCount={listing.reviewCount.toString()} />
          </div>
          <h1 className="mt-4 md:text-heading-xl text-heading-m font-medium leading-tight text-[#252423]">{listing.title}</h1>
          <p className="mt-1 flex items-center gap-1 md:text-sm text-tiny font-semibold text-[#5E6588]">
            <MapPin className="h-4 w-4" />
            {listing.location}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {listing.badges.map((badge) => (
              <ListingBadge key={badge.id}>{badge.name}</ListingBadge>
            ))}
          </div>
          <AboutCopy description={listing.description} compact />
        </section>
      </div>

      <ListingFeatures features={listing.features} variant="mobile" />

      <div className="px-5 pb-10">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] py-4 text-small font-extrabold text-[#252423]"
          onClick={handleChatWithVendor}
        >
          <MessageSquare className="h-5 w-5" />
          Chat with Vendor
        </button>
      </div>

      <ReviewsSection metrics={listing.reviewMetrics} reviews={listing.reviews} rating={listing.rating} reviewCount={listing.reviewCount} variant="mobile" />
      <SimilarVenues venues={similarVenues || []} variant="mobile" />

      <MobileBookingDock
        listingId= {listing.id}
        price={`₦${listing.priceFrom.toLocaleString()}`}
        priceRaw={listing.priceFrom}
        booked={booking.booked}
        dateRange={booking.dateRange}
        onDateChange={booking.setDateRange}
        onBook={booking.bookNow}
      />
      <MobileDock />
      <HomeFooter />
    </section>
  );
}

function TabletDetailsView({ booking, handleSearch, form, isPending, listing, similarVenues }: DetailsViewProps) {
  const gallery = listing.images.map((img) => img.url);

  return (
    <section className="hidden md:block xl:hidden w-full">
      <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isPending} filter={false} />
      <TabletPhotoGallery gallery={gallery} name={listing.title} />

      <div className="mx-auto grid grid-cols-[minmax(0,1fr)_20rem] gap-10 px-8 py-12">
        <div>
          <div className="flex items-start justify-between gap-8">
            <div>
              <h1 className="text-heading-xl font-extrabold text-[#252423]">{listing.title}</h1>
              <span className="flex gap-8"> 
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5E6588]">
                  <MapPin className="h-4 w-4" />
                  {listing.location}
                </p>
                <DetailsActions />
              </span>
            </div>
            <div className="flex items-end gap-2">
              <RatingBadge rating={listing.rating.toFixed(1)} reviewsCount={listing.reviewCount.toString()} />
              <VerifiedVenueBadge />
            </div>
          </div>

          <div className="mt-7 flex gap-3">
            {listing.badges.map((badge) => (
              <ListingBadge key={badge.id}>{badge.name}</ListingBadge>
            ))}
          </div>

          <AboutCopy description={listing.description} />
          <ListingFeatures features={listing.features} />
          <ReviewsSection metrics={listing.reviewMetrics} reviews={listing.reviews} rating={listing.rating} reviewCount={listing.reviewCount} />
        </div>

        <BookingCard
          booked={booking.booked}
          dateRange={booking.dateRange}
          guests={booking.guests}
          time={booking.time}
          onBook={booking.bookNow}
          listingId={listing.id}
          onDateChange={booking.setDateRange}
          onGuestsChange={booking.setGuests}
          onTimeChange={booking.setTime}
          price={`₦${listing.priceFrom.toLocaleString()}`}
        />
      </div>

      <div className="mx-auto max-w-5xl px-8">
        <SimilarVenues venues={similarVenues || []} />
      </div>
      <HomeFooter />
    </section>
  );
}

function DesktopDetailsView({ booking, handleSearch, form, isPending, listing, similarVenues }: DetailsViewProps) {
  const gallery = listing.images.map((img) => img.url);

  return (
    <section className="hidden xl:flex">
      <SideNavBar />
      <div className="ml-[15%] w-[85%] flex flex-col">
        <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isPending} filter={false} />

        <div className="flex flex-1">
          <div className="flex-1 px-8 pb-12 pt-10">
            <DesktopPhotoGallery gallery={gallery} name={listing.title} />
            <div className="grid grid-cols-[minmax(0,1fr)_20rem] gap-20 pr-8 py-12">
              <div>
                <div className="flex items-start justify-between gap-8">
                  <div>
                    <h1 className="text-heading-xl font-extrabold text-[#252423]">{listing.title}</h1>
                    <span className="flex gap-8"> 
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5E6588]">
                        <MapPin className="h-4 w-4" />
                        {listing.location}
                      </p>
                      <DetailsActions />
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RatingBadge rating={listing.rating.toFixed(1)} reviewsCount={listing.reviewCount.toString()} />
                    <VerifiedVenueBadge />
                  </div>
                </div>

                <div className="mt-7 flex gap-3">
                  {listing.badges.map((badge) => (
                    <ListingBadge key={badge.id}>{badge.name}</ListingBadge>
                  ))}
                </div>

                <AboutCopy description={listing.description} />
                <ListingFeatures features={listing.features} />
                <ReviewsSection metrics={listing.reviewMetrics} reviews={listing.reviews} rating={listing.rating} reviewCount={listing.reviewCount} />
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
                price={`₦${listing.priceFrom.toLocaleString()}`}
                listingId={listing.id}
              />
            </div>

            <SimilarVenues venues={similarVenues || []} />
          </div>
        </div>
        <HomeFooter />
      </div>
    </section>
  );
}

export default function HallDetails() {
  const booking = useBookingState();
  const [isPending, startTransition] = useTransition();
  const form = useSearchForm();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: listing, isLoading, isError } = useListingDetails(id);
  const { data: similarVenues } = useSimilarListings({ 
    city: listing?.city || undefined, 
    kind: listing?.kind, 
    excludeId: id 
  });

  
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-pulse text-xl font-extrabold text-[#5E6588]">Loading venue...</div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-xl font-extrabold text-[#B9401D]">Failed to load venue details.</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <MobileDetailsView booking={booking} listing={listing} similarVenues={similarVenues} />
      <TabletDetailsView booking={booking} handleSearch={handleSearch} form={form} isPending={isPending} listing={listing} similarVenues={similarVenues} />
      <DesktopDetailsView booking={booking} handleSearch={handleSearch} form={form} isPending={isPending} listing={listing} similarVenues={similarVenues} />
    </main>
  );
}
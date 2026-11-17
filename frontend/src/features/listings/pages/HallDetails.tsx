"use client";

import { useState, useTransition } from "react";
import { MapPin, MessageSquare } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import BookingCard from "../components/details/BookingCard";
import {
  DetailsActions,
  MobileDetailsHeader,
} from "../components/details/DetailsHeader";
import {
  ListingBadge,
  RatingBadge,
  VerifiedVenueBadge,
} from "../components/details/DetailBadges";
import ListingFeatures from "../components/details/ListingFeatures";
import {
  DesktopPhotoGallery,
  MobileHeroPhoto,
  TabletPhotoGallery,
} from "../components/details/PhotoGallery";
import ReviewsSection from "../components/details/ReviewsSection";
import SimilarVenues from "../components/details/SimilarVenues";
import AboutSection from "../components/details/AboutSection";
import SideNavBar from "@/components/layout/SideNavBar";
import { DesktopExploreHeader } from "../components/explore/DesktopExploreHeader";
import { buildListingsUrl, useSearchForm } from "@/features/search";
import type { SearchFormData } from "@/features/search/utils/searchSchema";
import type { DateRange } from "@/features/search/utils/searchSchema";
import { envelope } from "@/features/search/utils/rangeSelection";
import HomeFooter from "@/components/layout/Footer";
import { MobileBookingDock } from "../components/details/MobileBookingDock";
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

/**
 * The detail page owns only the date selection. Guest count, 24-hour times,
 * notes and the service address are collected in the booking wizard - the
 * hand-off carries the full multi-range selection so nothing is lost.
 */
function useBookingState() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [booked, setBooked] = useState(false);

  return {
    booked,
    dateRanges,
    setDateRanges,
    bookNow: () => {
      const bookingPayload = {
        dateRanges,
        // Legacy envelope kept for any consumer still reading `dateRange`.
        dateRange: envelope(dateRanges),
      };
      try {
        localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingPayload));
      } catch (error) {
        console.error("Failed to save booking to localStorage:", error);
      }
      setBooked(true);
      router.push(`/bookings/${id}?step=1`);
    },
  };
}

function MobileDetailsView({
  booking,
  listing,
  similarVenues,
}: {
  booking: ReturnType<typeof useBookingState>;
  listing: ListingDetailsResponse;
  similarVenues: ListingCardSmall[] | undefined;
}) {
  const router = useRouter();

  const handleChatWithVendor = async () => {
    try {
      const res = await createConversation({ listingId: listing.id });
      router.push(`/messages?conversationId=${res.id}`);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const gallery = listing.images.map((img) => img.url);

  return (
    <section className="md:hidden">
      <MobileDetailsHeader title={listing.name} />
      <MobileHeroPhoto
        image={gallery[0] || "/placeholder.jpg"}
        name={listing.title}
        photosHref={`/listings/halls/${listing.id}/photos`}
      />

      <div className="relative z-10 -mt-12 px-5">
        <section className="rounded-4xl bg-white p-7 shadow-[0_20px_38px_rgba(36,28,18,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <VerifiedVenueBadge />
            <RatingBadge
              rating={listing.rating.toFixed(1)}
              reviewsCount={listing.reviewCount.toString()}
            />
          </div>
          <h1 className="mt-4 text-heading-m font-medium leading-tight text-[#252423] md:text-heading-xl">
            {listing.title}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-tiny font-semibold text-[#5E6588] md:text-sm">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {listing.location}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {listing.badges.map((badge) => (
              <ListingBadge key={badge.id}>{badge.name}</ListingBadge>
            ))}
          </div>
          <AboutSection description={listing.description} compact />
        </section>
      </div>

      <ListingFeatures features={listing.features} variant="mobile" />

      <div className="px-5 pb-10">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] py-4 text-small font-extrabold text-[#252423] transition-all active:scale-[0.99]"
          onClick={handleChatWithVendor}
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          Chat with Vendor
        </button>
      </div>

      <ReviewsSection
        metrics={listing.reviewMetrics}
        reviews={listing.reviews}
        rating={listing.rating}
        reviewCount={listing.reviewCount}
        variant="mobile"
      />
      <SimilarVenues venues={similarVenues || []} variant="mobile" />

      <MobileBookingDock
        listingId={listing.id}
        price={`₦${listing.priceFrom.toLocaleString()}`}
        priceRaw={listing.priceFrom}
        booked={booking.booked}
        dateRanges={booking.dateRanges}
        onDateRangesChange={booking.setDateRanges}
        onBook={booking.bookNow}
        kind="hall"
        unavailableDates={listing.unavailableDates ?? []}
      />
      <MobileDock />
      <HomeFooter />
    </section>
  );
}

function TabletDetailsView({
  booking,
  handleSearch,
  form,
  isPending,
  listing,
  similarVenues,
}: DetailsViewProps) {
  const gallery = listing.images.map((img) => img.url);

  return (
    <section className="hidden w-full md:block xl:hidden">
      <DesktopExploreHeader
        handleSearch={handleSearch}
        form={form}
        isPending={isPending}
        filter={false}
        category="halls"
      />
      <TabletPhotoGallery
        gallery={gallery}
        name={listing.title}
        photosHref={`/listings/halls/${listing.id}/photos`}
      />

      <div className="mx-auto grid grid-cols-[minmax(0,1fr)_20rem] gap-10 px-8 py-12">
        <div>
          <div className="flex items-start justify-between gap-8">
            <div>
              <h1 className="text-heading-xl font-extrabold text-[#252423]">
                {listing.title}
              </h1>
              <span className="flex gap-8">
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5E6588]">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {listing.location}
                </p>
                <DetailsActions />
              </span>
            </div>
            <div className="flex items-end gap-2">
              <RatingBadge
                rating={listing.rating.toFixed(1)}
                reviewsCount={listing.reviewCount.toString()}
              />
              <VerifiedVenueBadge />
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {listing.badges.map((badge) => (
              <ListingBadge key={badge.id}>{badge.name}</ListingBadge>
            ))}
          </div>

          <AboutSection description={listing.description} />
          <ListingFeatures features={listing.features} />
          <ReviewsSection
            metrics={listing.reviewMetrics}
            reviews={listing.reviews}
            rating={listing.rating}
            reviewCount={listing.reviewCount}
          />
        </div>

        <BookingCard
          booked={booking.booked}
          dateRanges={booking.dateRanges}
          onDateRangesChange={booking.setDateRanges}
          onBook={booking.bookNow}
          listingId={listing.id}
          price={`₦${listing.priceFrom.toLocaleString()}`}
          priceRaw={listing.priceFrom}
          unavailableDates={listing.unavailableDates ?? []}
        />
      </div>

      <div className="mx-auto max-w-5xl px-8">
        <SimilarVenues venues={similarVenues || []} />
      </div>
      <HomeFooter />
    </section>
  );
}

function DesktopDetailsView({
  booking,
  handleSearch,
  form,
  isPending,
  listing,
  similarVenues,
}: DetailsViewProps) {
  const gallery = listing.images.map((img) => img.url);

  return (
    <section className="hidden xl:flex">
      <SideNavBar />
      <div className="ml-[15%] flex w-[85%] flex-col">
        <DesktopExploreHeader
          handleSearch={handleSearch}
          form={form}
          isPending={isPending}
          filter={false}
          category="halls"
        />

        <div className="flex flex-1">
          <div className="flex-1 px-8 pb-12 pt-10">
            <DesktopPhotoGallery
              gallery={gallery}
              name={listing.title}
              photosHref={`/listings/halls/${listing.id}/photos`}
            />

            <div className="grid grid-cols-[minmax(0,1fr)_20rem] gap-20 py-12 pr-8">
              <div>
                <div className="flex items-start justify-between gap-8">
                  <div>
                    <h1 className="text-heading-xl font-extrabold text-[#252423]">
                      {listing.title}
                    </h1>
                    <span className="flex gap-8">
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5E6588]">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {listing.location}
                      </p>
                      <DetailsActions />
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RatingBadge
                      rating={listing.rating.toFixed(1)}
                      reviewsCount={listing.reviewCount.toString()}
                    />
                    <VerifiedVenueBadge />
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  {listing.badges.map((badge) => (
                    <ListingBadge key={badge.id}>{badge.name}</ListingBadge>
                  ))}
                </div>

                <AboutSection description={listing.description} />
                <ListingFeatures features={listing.features} />
                <ReviewsSection
                  metrics={listing.reviewMetrics}
                  reviews={listing.reviews}
                  rating={listing.rating}
                  reviewCount={listing.reviewCount}
                />
              </div>

              <BookingCard
                booked={booking.booked}
                dateRanges={booking.dateRanges}
                onDateRangesChange={booking.setDateRanges}
                onBook={booking.bookNow}
                price={`₦${listing.priceFrom.toLocaleString()}`}
                priceRaw={listing.priceFrom}
                listingId={listing.id}
                unavailableDates={listing.unavailableDates ?? []}
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
    excludeId: id,
  });

  const handleSearch = (data: SearchFormData) => {
    startTransition(() => {
      router.push(buildListingsUrl(data));
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <span
            className="h-9 w-9 animate-spin rounded-full border-2 border-[#B9401D]/25 border-t-[#B9401D]"
            aria-hidden="true"
          />
          <p className="text-sm font-bold text-[#5E6588]">Loading venue…</p>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
        <div className="max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-[0_20px_44px_rgba(34,27,18,0.07)]">
          <h1 className="text-xl font-extrabold text-[#B9401D]">
            Failed to load venue details
          </h1>
          <p className="mt-2 text-sm font-semibold text-[#5E6588]">
            This venue may have been removed. Try exploring other venues.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <MobileDetailsView
        booking={booking}
        listing={listing}
        similarVenues={similarVenues}
      />
      <TabletDetailsView
        booking={booking}
        handleSearch={handleSearch}
        form={form}
        isPending={isPending}
        listing={listing}
        similarVenues={similarVenues}
      />
      <DesktopDetailsView
        booking={booking}
        handleSearch={handleSearch}
        form={form}
        isPending={isPending}
        listing={listing}
        similarVenues={similarVenues}
      />
    </main>
  );
}
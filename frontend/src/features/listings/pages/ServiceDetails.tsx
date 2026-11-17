"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Info, ShieldCheck, MapPin, MessageSquare, Clock, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import SideNavBar from "@/components/layout/SideNavBar";
import { useSearchForm } from "@/features/search/hooks/useSearchForm";
import { MobileDetailsHeader, DetailsActions } from "../components/details/DetailsHeader";
import {
  DesktopPhotoGallery,
  TabletPhotoGallery,
  MobileHeroPhoto,
} from "../components/details/PhotoGallery";
import { DesktopExploreHeader } from "../components/explore/DesktopExploreHeader";
import { RatingBadge, ListingBadge } from "../components/details/DetailBadges";
import ReviewsSection from "../components/details/ReviewsSection";
import AboutSection from "../components/details/AboutSection";
import PackageAccordion from "../components/details/PackageAccordion";
import MobileDock from "@/components/layout/MobileDock";
import HomeFooter from "@/components/layout/Footer";
import { MobileBookingDock } from "../components/details/MobileBookingDock";
import { DateRangePicker } from "@/features/search/components/DateRange";
import type { DateRange } from "@/features/search/utils/searchSchema";
import {
  countSelectedDays,
  envelope,
  excludedDates,
  finalizeRanges,
} from "@/features/search/utils/rangeSelection";
import { usePricingQuote } from "@/features/bookings/hooks/usePricingQuote";
import { useListingDetails } from "../hooks/useListingDetails";
import { BOOKING_STORAGE_KEY } from "@/features/bookings/booking.data";
import { createConversation } from "@/features/chat/chat.api";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const ASIDE_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40";

function fmt(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function ServiceDetails() {
  const form = useSearchForm();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: listing, isLoading, isError } = useListingDetails(id);

  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);

  const mappedPackages = useMemo(
    () =>
      (listing?.packages || []).map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        price: fmt(pkg.price),
        priceValue: pkg.price,
        description: pkg.description || "",
        isPopular: pkg.isPopular,
        features: pkg.features.map((f) => f.text),
      })),
    [listing?.packages]
  );

  // Derived, never setState-during-render: the popular (or first) package is
  // selected until the user picks one, so the accordion opens on first paint
  // and a price always exists.
  const defaultPackageId =
    mappedPackages.find((p) => p.isPopular)?.id ?? mappedPackages[0]?.id ?? "";
  const activePackageId = selectedPackage || defaultPackageId;
  const activePackage =
    mappedPackages.find((p) => p.id === activePackageId) ?? mappedPackages[0];

  const priceRaw = activePackage ? activePackage.priceValue : listing?.priceFrom ?? 0;
  const priceString = activePackage ? activePackage.price : fmt(listing?.priceFrom ?? 0);

  const range = envelope(dateRanges);
  const holes = useMemo(() => excludedDates(dateRanges), [dateRanges]);
  const hasDates = finalizeRanges(dateRanges).length > 0;
  const dayCount = countSelectedDays(dateRanges);

  const { data: quote, isLoading: quoteLoading } = usePricingQuote(
    id,
    range,
    activePackageId || undefined,
    holes
  );

  const handleChatWithVendor = async () => {
    if (!listing) return;
    try {
      const res = await createConversation({ listingId: listing.id });
      router.push(`/messages?conversationId=${res.id}`);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const handleRequestToBook = () => {
    const bookingPayload = {
      packageId: activePackageId,
      dateRanges,
      dateRange: envelope(dateRanges),
    };
    try {
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingPayload));
    } catch (error) {
      console.error("Failed to save booking draft:", error);
    }
    router.push(`/bookings/${id}?step=1`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <span
            className="h-9 w-9 animate-spin rounded-full border-2 border-[#B9401D]/25 border-t-[#B9401D]"
            aria-hidden="true"
          />
          <p className="text-sm font-bold text-[#5E6588]">Loading service…</p>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
        <div className="max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-[0_20px_44px_rgba(34,27,18,0.07)]">
          <h1 className="text-xl font-extrabold text-[#B9401D]">
            Failed to load service details
          </h1>
          <p className="mt-2 text-sm font-semibold text-[#5E6588]">
            This service may have been removed. Try exploring other providers.
          </p>
        </div>
      </div>
    );
  }

  const gallery = listing.images.map((img) => img.url);
  const provider = {
    name: listing.title,
    avatar: listing.primaryImage?.url || "/placeholder.jpg",
    verified: listing.autoApprove,
    joined: "2023",
    totalEvents: 50,
    responseTime: listing.responseTime || "1 hour",
  };

  const coverageAreas =
    listing.serviceAreas && Array.isArray(listing.serviceAreas)
      ? Array.from(
          new Set(listing.serviceAreas.map((area) => area.city).filter(Boolean))
        )
      : [];

  const renderServiceInfo = (variant: "mobile" | "tablet" | "desktop") => (
    <>
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1
            className={
              variant === "mobile"
                ? "mt-4 text-heading-m font-medium leading-tight text-[#252423]"
                : "text-heading-xl font-extrabold text-[#252423]"
            }
          >
            {listing.title}
          </h1>
          <span className="flex gap-8">
            <p className="mt-1 flex items-center gap-1 text-tiny font-semibold text-[#5E6588] md:text-sm">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {listing.location}
            </p>
            {variant !== "mobile" && <DetailsActions />}
          </span>
        </div>
        {variant !== "mobile" && (
          <div
            className={
              variant === "desktop"
                ? "flex flex-col items-end gap-2"
                : "flex items-end gap-2"
            }
          >
            <RatingBadge
              rating={listing.rating.toFixed(1)}
              reviewsCount={listing.reviewCount.toString()}
            />
            {provider.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F5EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#0D6229]">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Verified
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 md:mt-7">
        {listing.badges.map((badge) => (
          <ListingBadge key={badge.id}>{badge.name}</ListingBadge>
        ))}
      </div>

      <div className="mt-8 border-y border-[#E8DDD2] py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[#E8DDD2]">
              <Image
                src={provider.avatar}
                alt={provider.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-heading-m font-bold md:text-xl">
                {provider.name}
                {provider.verified && (
                  <ShieldCheck className="h-5 w-5 text-green-600" aria-hidden="true" />
                )}
              </h2>
              <p className="mt-1 text-tiny text-[#5E6588] md:text-sm">
                Joined {provider.joined} • {provider.totalEvents} Events
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={variant === "mobile" ? "mt-6" : "mt-8"}>
        <AboutSection
          description={listing.description}
          title="About the Service"
          compact={variant === "mobile"}
        />

        {coverageAreas.length > 0 && (
          <div className="mt-12 border-t border-[#E8DDD2] pt-12">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-[#252423] md:text-[1.35rem]">
              <MapPin className="h-4 w-4 text-[#B9401D] md:h-5 md:w-5" aria-hidden="true" />
              Coverage Areas
            </h3>
            <div className="mt-6 flex flex-wrap gap-3">
              {coverageAreas.map((area, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F2EC] px-4 py-2 text-tiny font-bold capitalize text-[#3A3734] md:text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {variant !== "mobile" && (
        <>
          <div className="mt-12 border-t border-[#E8DDD2] pt-12">
            <h3 className="text-[1.35rem] font-extrabold text-[#252423]">
              Provider Requirements
            </h3>
            <div className="mt-6 space-y-4">
              {listing.requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Info className="mt-1 h-5 w-5 shrink-0 text-[#B9401D]" aria-hidden="true" />
                  <p className="text-[0.95rem] text-[#555B7F]">{req}</p>
                </div>
              ))}
            </div>
          </div>

          <ReviewsSection
            metrics={listing.reviewMetrics}
            reviews={listing.reviews}
            rating={listing.rating}
            reviewCount={listing.reviewCount}
            variant="desktop"
          />
        </>
      )}
    </>
  );

  /**
   * Tablet/desktop booking rail: package → dates → live total → Book.
   * Services previously had no date picker here at all, so the price only
   * appeared after leaving the page. It now uses the exact same multi-range
   * calendar (and live availability greying) as the booking step.
   */
  const renderAside = () => (
    <aside
      className={`sticky top-8 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[1.35rem] border border-[#E8DDD2] bg-white p-7 shadow-[0_24px_54px_rgba(34,27,18,0.1)] ${ASIDE_SCROLLBAR}`}
    >
      <h3 className="mb-5 text-xl font-bold text-[#252423]">Service Packages</h3>
      <PackageAccordion
        packages={mappedPackages}
        selectedId={activePackageId}
        onSelect={setSelectedPackage}
        variant="desktop"
      />

      <div className="mt-6 overflow-hidden rounded-[1.35rem] border border-[#E8DDD2]">
        <div className="border-b border-[#E8DDD2] bg-white">
          <DateRangePicker
            multi
            ranges={dateRanges}
            onRangesChange={setDateRanges}
            value={undefined}
            onChange={() => {}}
            issearch={false}
            listingId={listing.id}
            unavailableDates={listing.unavailableDates ?? []}
          />
        </div>

        <div className="bg-[#FAF8F5] px-5 py-4">
          {!hasDates ? (
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
              <div>
                <p className="text-sm font-extrabold text-[#252423]">
                  Select dates to see your total
                </p>
                <p className="mt-0.5 text-[11px] font-semibold leading-5 text-[#7B7E9B]">
                  {fmt(priceRaw)} per day × the days you keep, plus 7.5% VAT.
                </p>
              </div>
            </div>
          ) : quoteLoading ? (
            <div className="animate-pulse space-y-2.5">
              <div className="h-3.5 w-3/4 rounded bg-[#E8E1D7]" />
              <div className="h-3.5 w-1/2 rounded bg-[#E8E1D7]" />
              <div className="h-6 w-2/3 rounded bg-[#E8E1D7]" />
            </div>
          ) : quote ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="font-semibold text-[#5E6588]">
                  {fmt(priceRaw)} × {quote.days} {quote.days === 1 ? "day" : "days"}
                </span>
                <strong className="shrink-0 text-[#252423]">{fmt(quote.subtotal)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-[#5E6588]">VAT (7.5%)</span>
                <strong className="text-[#252423]">{fmt(quote.vat)}</strong>
              </div>
              {holes.length > 0 && (
                <p className="text-[11px] font-bold text-[#2D5A27]">
                  {holes.length} removed {holes.length === 1 ? "day" : "days"} not charged
                </p>
              )}
              <div className="flex items-end justify-between gap-3 border-t border-[#E8DDD2] pt-2.5">
                <span className="text-sm font-extrabold text-[#252423]">Total</span>
                <motion.strong
                  key={quote.total}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="text-xl font-extrabold text-[#B9401D]"
                >
                  {fmt(quote.total)}
                </motion.strong>
              </div>
            </motion.div>
          ) : (
            <p className="text-sm font-semibold text-[#9A9AAE]">
              We couldn&apos;t price these dates. Try selecting them again.
            </p>
          )}
        </div>
      </div>

      {hasDates && (
        <p className="mt-3 text-center text-[11px] font-bold text-[#B9401D]">
          {dayCount} {dayCount === 1 ? "day" : "days"} selected
        </p>
      )}

      <button
        type="button"
        onClick={handleRequestToBook}
        className="mt-5 w-full rounded-full bg-[#B9401D] px-6 py-4 text-sm font-extrabold text-white shadow-[0_14px_26px_rgba(185,64,29,0.18)] transition-all hover:brightness-95 active:scale-[0.99]"
      >
        Book
      </button>
      <button
        type="button"
        onClick={handleChatWithVendor}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-sm font-extrabold text-[#252423] transition-all hover:brightness-95 active:scale-[0.99]"
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        Contact Vendor
      </button>

      <p className="mt-4 text-center text-[11px] font-semibold text-[#7B7E9B]">
        You won&apos;t be charged yet
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#EFE8DE] pt-4 text-xs font-semibold text-[#7B7E9B]">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>Usually responds {provider.responseTime}</span>
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      {/* MOBILE */}
      <section className="md:hidden">
        <MobileDetailsHeader title={listing.name} />
        <MobileHeroPhoto
          image={gallery[0] || "/placeholder.jpg"}
          name={listing.title}
          photosHref={`/listings/services/${listing.id}/photos`}
        />

        <div className="relative z-10 -mt-12 px-5">
          <section className="rounded-4xl bg-white p-7 shadow-[0_20px_38px_rgba(36,28,18,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              {provider.verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F5EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#0D6229]">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Verified
                </span>
              )}
              <RatingBadge
                rating={listing.rating.toFixed(1)}
                reviewsCount={listing.reviewCount.toString()}
              />
            </div>
            {renderServiceInfo("mobile")}
          </section>
        </div>

        <div className="mt-10 px-5 pb-10">
          <h3 className="mb-4 text-heading-m font-bold">Packages</h3>
          <PackageAccordion
            packages={mappedPackages}
            selectedId={activePackageId}
            onSelect={setSelectedPackage}
            variant="mobile"
          />
        </div>

        <div className="px-5 pb-10">
          <div className="border-t border-[#E8DDD2] pt-10">
            <h3 className="text-base font-extrabold text-[#252423]">
              Provider Requirements
            </h3>
            <div className="mt-6 space-y-4">
              {listing.requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Info className="h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
                  <p className="text-small text-[#555B7F]">{req}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ReviewsSection
          metrics={listing.reviewMetrics}
          reviews={listing.reviews}
          rating={listing.rating}
          reviewCount={listing.reviewCount}
          variant="mobile"
        />

        <div className="px-5 pb-32 pt-10">
          <button
            onClick={handleChatWithVendor}
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-small font-extrabold text-[#252423] transition-all active:scale-[0.99]"
          >
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            Chat with Vendor
          </button>
        </div>

        <MobileBookingDock
          listingId={listing.id}
          price={priceString}
          priceRaw={priceRaw}
          booked={false}
          dateRanges={dateRanges}
          onDateRangesChange={setDateRanges}
          onBook={handleRequestToBook}
          packageId={activePackageId}
          kind="service"
          unavailableDates={listing.unavailableDates ?? []}
        />
        <MobileDock />
        <HomeFooter />
      </section>

      {/* TABLET */}
      <section className="hidden w-full md:block xl:hidden">
        <DesktopExploreHeader
          handleSearch={() => {}}
          form={form}
          isPending={false}
          filter={false}
          category="services"
        />
        <TabletPhotoGallery
          gallery={gallery}
          name={listing.title}
          photosHref={`/listings/services/${listing.id}/photos`}
        />
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)_20rem] gap-10 px-8 py-12">
          <div>{renderServiceInfo("tablet")}</div>
          {renderAside()}
        </div>
        <HomeFooter />
      </section>

      {/* DESKTOP */}
      <section className="hidden xl:flex">
        <SideNavBar />
        <div className="ml-[15%] flex w-[85%] flex-col">
          <DesktopExploreHeader
            handleSearch={() => {}}
            form={form}
            isPending={false}
            filter={false}
            category="services"
          />
          <div className="flex flex-1">
            <div className="flex-1 px-8 pb-12 pt-10">
              <DesktopPhotoGallery
                gallery={gallery}
                name={listing.title}
                photosHref={`/listings/services/${listing.id}/photos`}
              />
              <div className="grid grid-cols-[minmax(0,1fr)_20rem] gap-20 py-12 pr-8">
                <div>{renderServiceInfo("desktop")}</div>
                {renderAside()}
              </div>
            </div>
          </div>
          <HomeFooter />
        </div>
      </section>
    </main>
  );
}
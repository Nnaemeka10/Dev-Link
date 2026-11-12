"use client";

import { useState } from "react";
import Image from "next/image";
import { Info, ShieldCheck, MapPin, MessageSquare, Clock } from "lucide-react";
import SideNavBar from "@/components/layout/SideNavBar";
import { useSearchForm } from "@/features/search/hooks/useSearchForm";
import { MobileDetailsHeader, DetailsActions } from "../components/details/DetailsHeader";
import { DesktopPhotoGallery, TabletPhotoGallery, MobileHeroPhoto } from "../components/details/PhotoGallery";
import { DesktopExploreHeader } from "../components/explore/DesktopExploreHeader";
import { RatingBadge, ListingBadge } from "../components/details/DetailBadges";
import ReviewsSection from "../components/details/ReviewsSection";
import AboutSection from "../components/details/AboutSection";
import PackageAccordion from "../components/details/PackageAccordion";
import MobileDock from "@/components/layout/MobileDock";
import HomeFooter from "@/components/layout/Footer";
import { MobileBookingDock } from "../components/details/MobileBookingDock";
import type { DateRange } from "@/features/search/utils/searchSchema";

import { useParams, useRouter } from "next/navigation";
import { useListingDetails } from "../hooks/useListingDetails";
import { BOOKING_STORAGE_KEY } from "@/features/bookings/booking.data";
import { createConversation } from "@/features/chat/chat.api";

export default function ServiceDetails() {
  const form = useSearchForm();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: listing, isLoading, isError } = useListingDetails(id);

  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleChatWithVendor = async () => {
    if (!listing) return;
    try {
      const res = await createConversation({ listingId: listing.id });
      router.push(`/messages?conversationId=${res.id}`);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const mappedPackages = (listing?.packages || []).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    price: `₦${pkg.price.toLocaleString()}`,
    priceValue: pkg.price,
    description: pkg.description || "",
    isPopular: pkg.isPopular,
    features: pkg.features.map((f) => f.text),
  }));

  // Derived, never setState-during-render: the first package is selected until
  // the user picks one, so the accordion opens correctly on first paint.
  const activePackageId = selectedPackage || mappedPackages[0]?.id || "";
  const activePackage =
    mappedPackages.find((p) => p.id === activePackageId) ?? mappedPackages[0];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="animate-pulse text-xl font-extrabold text-[#5E6588]">Loading service...</div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="text-xl font-extrabold text-[#B9401D]">Failed to load service details.</div>
      </div>
    );
  }

  const gallery = listing.images.map((img) => img.url);

  const provider = {
    name: listing.title,
    avatar: listing.primaryImage?.url || "/placeholder-avatar.jpg",
    verified: listing.autoApprove,
    joined: "2023",
    totalEvents: 50,
    responseTime: listing.responseTime || "1 hour",
  };

  const coverageAreas =
    listing.serviceAreas && Array.isArray(listing.serviceAreas)
      ? Array.from(new Set(listing.serviceAreas.map((area) => area.city).filter(Boolean)))
      : [];

  const priceRaw = activePackage ? activePackage.priceValue : listing.priceFrom;
  const priceString = activePackage
    ? activePackage.price
    : `₦${listing.priceFrom.toLocaleString()}`;

  const handleRequestToBook = () => {
    if (!activePackageId) return;

    const bookingPayload = { packageId: activePackageId, dateRange };
    try {
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingPayload));
    } catch (error) {
      console.error("Failed to save booking draft:", error);
    }

    router.push(`/bookings/${id}?step=1`);
  };

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
              <MapPin className="h-4 w-4" />
              {listing.location}
            </p>
            {variant !== "mobile" && <DetailsActions />}
          </span>
        </div>
        {variant !== "mobile" && (
          <div
            className={
              variant === "desktop" ? "flex flex-col items-end gap-2" : "flex items-end gap-2"
            }
          >
            <RatingBadge
              rating={listing.rating.toFixed(1)}
              reviewsCount={listing.reviewCount.toString()}
            />
            {provider.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F5EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#0D6229]">
                <ShieldCheck className="h-3 w-3" />
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
              <Image src={provider.avatar} alt={provider.name} fill className="object-cover" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-heading-m font-bold md:text-xl">
                {provider.name}
                {provider.verified && <ShieldCheck className="h-5 w-5 text-green-600" />}
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
              <MapPin className="h-4 w-4 text-[#B9401D] md:h-5 md:w-5" />
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
            <h3 className="text-[1.35rem] font-extrabold text-[#252423]">Provider Requirements</h3>
            <div className="mt-6 space-y-4">
              {listing.requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Info className="mt-1 h-5 w-5 shrink-0 text-[#B9401D]" />
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

  const renderAside = () => (
    <aside className="sticky top-8 h-fit rounded-[1.35rem] border border-[#E8DDD2] bg-white p-8 shadow-[0_24px_54px_rgba(34,27,18,0.1)]">
      <h3 className="mb-6 text-2xl font-bold">Service Packages</h3>

      <div className="mb-8">
        <PackageAccordion
          packages={mappedPackages}
          selectedId={activePackageId}
          onSelect={setSelectedPackage}
          variant="desktop"
        />
      </div>

      <button
        onClick={handleRequestToBook}
        className="w-full rounded-full bg-[#B9401D] px-6 py-4 text-sm font-extrabold text-white transition hover:brightness-95 active:scale-[0.99]"
      >
        Request to Book
      </button>
      <button
        onClick={handleChatWithVendor}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-sm font-extrabold text-[#252423] transition hover:brightness-95 active:scale-[0.99]"
      >
        <MessageSquare className="h-4 w-4" />
        Contact Vendor
      </button>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-[#7B7E9B]">
        <Clock className="h-4 w-4" />
        <span>Usually responds {provider.responseTime}</span>
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      {/* MOBILE */}
      <section className="md:hidden">
        <MobileDetailsHeader title={listing.name} />
        <MobileHeroPhoto image={gallery[0] || "/placeholder.jpg"} name={listing.title} photosHref = {`/listings/services/${listing.id}/photos`}/>

        <div className="relative z-10 -mt-12 px-5">
          <section className="rounded-4xl bg-white p-7 shadow-[0_20px_38px_rgba(36,28,18,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              {provider.verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F5EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#0D6229]">
                  <ShieldCheck className="h-3 w-3" />
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
          <div className="mt-12 border-t border-[#E8DDD2] pt-12">
            <h3 className="text-base font-extrabold text-[#252423]">Provider Requirements</h3>
            <div className="mt-6 space-y-4">
              {listing.requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Info className="h-4 w-4 shrink-0 text-[#B9401D]" />
                  <p className="text-small text-[#555B7F]">{req}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 px-0 pb-10">
          <ReviewsSection
            metrics={listing.reviewMetrics}
            reviews={listing.reviews}
            rating={listing.rating}
            reviewCount={listing.reviewCount}
            variant="mobile"
          />
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

        <div className="px-5 pb-32">
          <button
            onClick={handleChatWithVendor}
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-small font-extrabold text-[#252423]"
          >
            <MessageSquare className="h-5 w-5" />
            Chat with Vendor
          </button>
        </div>

        <MobileBookingDock
          listingId={listing.id}
          price={priceString}
          priceRaw={priceRaw}
          booked={false}
          dateRange={dateRange}
          onDateChange={setDateRange}
          onBook={handleRequestToBook}
          packageId={activePackageId}
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
        <TabletPhotoGallery gallery={gallery} name={listing.title} photosHref = {`/listings/services/${listing.id}/photos`}/>

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
              <DesktopPhotoGallery gallery={gallery} name={listing.title} photosHref = {`/listings/services/${listing.id}/photos`}/>

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
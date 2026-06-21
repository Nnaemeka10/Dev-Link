"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Info, ShieldCheck, MapPin, MessageSquare, Clock } from "lucide-react";
import SideNavBar from "@/components/layout/SideNavBar";
import DesktopSearchBar from "@/features/search/components/DesktopSearchBar";
import { useSearchForm } from "@/features/search/hooks/useSearchForm";
import { DesktopDetailsHeader, MobileDetailsHeader, DetailsActions } from "../components/details/DetailsHeader";
import { DesktopPhotoGallery, TabletPhotoGallery, MobileHeroPhoto } from "../components/details/PhotoGallery";
import { DesktopExploreHeader } from "../components/explore/DesktopExploreHeader";
import { RatingBadge, ListingBadge, VerifiedVenueBadge } from "../components/details/DetailBadges";
import ReviewsSection from "../components/details/ReviewsSection";
import MobileDock from "@/components/layout/MobileDock";
import HomeFooter from "@/components/layout/Footer";
import { SERVICE_DETAILS } from "../service-details.data";

export default function ServiceDetails() {
  const form = useSearchForm();
  const [selectedPackage, setSelectedPackage] = useState(SERVICE_DETAILS.packages[0].id);

  const getPackage = () => SERVICE_DETAILS.packages.find(p => p.id === selectedPackage) || SERVICE_DETAILS.packages[0];

  const renderServiceInfo = (variant: "mobile" | "tablet" | "desktop") => (
    <>
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className={variant === "mobile" ? "mt-4 text-[2rem] font-medium leading-tight text-[#252423]" : "text-[2rem] font-extrabold text-[#252423]"}>{SERVICE_DETAILS.name}</h1>
          <span className="flex gap-8"> 
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5E6588]">
              <MapPin className="h-4 w-4" />
              {SERVICE_DETAILS.location}
            </p>
            {variant !== "mobile" && <DetailsActions />}
          </span>
        </div>
        {variant !== "mobile" && (
          <div className={variant === "desktop" ? "flex flex-col items-end gap-2" : "flex items-end gap-2"}>
            <RatingBadge rating={SERVICE_DETAILS.rating.toFixed(1)} reviewsCount={SERVICE_DETAILS.reviewsCount.toString()} />
            {SERVICE_DETAILS.provider.verified && (
               <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F5EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#0D6229]">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        {SERVICE_DETAILS.badges.map((badge) => (
          <ListingBadge key={badge}>{badge}</ListingBadge>
        ))}
      </div>

      <div className="mt-8 border-y border-[#E8DDD2] py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[#E8DDD2]">
              <Image src={SERVICE_DETAILS.provider.avatar} alt={SERVICE_DETAILS.provider.name} fill className="object-cover" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                {SERVICE_DETAILS.provider.name}
                {SERVICE_DETAILS.provider.verified && <ShieldCheck className="h-5 w-5 text-green-600" />}
              </h2>
              <p className="mt-1 text-sm text-[#5E6588]">
                Joined {SERVICE_DETAILS.provider.joined} • {SERVICE_DETAILS.provider.totalEvents} Events
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={variant === "mobile" ? "mt-10" : "mt-12"}>
        <h3 className="text-[1.35rem] font-extrabold text-[#252423]">About the Service</h3>
        <p className="mt-4 text-[0.95rem] leading-[1.8] text-[#555B7F]">{SERVICE_DETAILS.about}</p>
      </div>

      <div className="mt-12 border-t border-[#E8DDD2] pt-12">
        <h3 className="text-[1.35rem] font-extrabold text-[#252423]">Provider Requirements</h3>
        <div className="mt-6 space-y-4">
          {SERVICE_DETAILS.requirements.map((req, i) => (
            <div key={i} className="flex items-start gap-4">
              <Info className="mt-1 h-5 w-5 text-[#B9401D]" />
              <p className="text-[0.95rem] text-[#555B7F]">{req}</p>
            </div>
          ))}
        </div>
      </div>
      
      <ReviewsSection metrics={[{label: "Value", value: "5.0"}, {label: "Vibes", value: "4.8"}, {label: "Quality", value: "4.7"}, {label: "Communication", value: "4.9"}]} reviews={SERVICE_DETAILS.reviews} variant={variant === "mobile" ? "mobile" : "desktop"} />
    </>
  );

  const renderAside = () => (
    <aside className="sticky top-8 rounded-[1.35rem] border border-[#E8DDD2] bg-white shadow-[0_24px_54px_rgba(34,27,18,0.1)] p-8 h-fit">
      <h3 className="text-2xl font-bold mb-6">Service Packages</h3>
      
      <div className="space-y-4 mb-8">
        {SERVICE_DETAILS.packages.map((pkg) => (
          <div 
            key={pkg.id} 
            onClick={() => setSelectedPackage(pkg.id)}
            className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
              selectedPackage === pkg.id ? "border-[#252423] bg-[#F9F7F5]" : "border-[#E8DDD2] hover:border-[#252423]"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-lg">{pkg.name}</h4>
              {pkg.isPopular && <span className="bg-[#FFDFA7] text-[#B9401D] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popular</span>}
            </div>
            <p className="text-2xl font-extrabold">{pkg.price}</p>
            <p className="text-sm text-[#5E6588] mt-2">{pkg.description}</p>
            
            {selectedPackage === pkg.id && (
              <div className="mt-4 pt-4 border-t border-[#E8DDD2] space-y-3">
                {pkg.features.map((feat, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <Check className="w-5 h-5 text-[#B9401D] flex-shrink-0" />
                    <span className="text-sm font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="w-full rounded-full bg-[#B9401D] px-6 py-4 text-sm font-extrabold text-white transition hover:brightness-95">
        Request to Book
      </button>
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-sm font-extrabold text-[#252423]">
        <MessageSquare className="h-4 w-4" />
        Contact Vendor
      </button>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-[#7B7E9B]">
        <Clock className="w-4 h-4" />
        <span>Usually responds {SERVICE_DETAILS.provider.responseTime}</span>
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      {/* MOBILE */}
      <section className="md:hidden">
        <MobileDetailsHeader />
        <MobileHeroPhoto image={SERVICE_DETAILS.gallery[0]} name={SERVICE_DETAILS.name} />

        <div className="relative z-10 -mt-12 px-5">
          <section className="rounded-[2rem] bg-white p-7 shadow-[0_20px_38px_rgba(36,28,18,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              {SERVICE_DETAILS.provider.verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F5EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#0D6229]">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
              <RatingBadge rating={SERVICE_DETAILS.rating.toFixed(1)} reviewsCount={SERVICE_DETAILS.reviewsCount.toString()} />
            </div>
            {renderServiceInfo("mobile")}
          </section>
        </div>

        <div className="px-5 pb-10 mt-10">
          <h3 className="text-2xl font-bold mb-4">Packages</h3>
          <div className="space-y-4">
            {SERVICE_DETAILS.packages.map((pkg) => (
              <div 
                key={pkg.id} 
                onClick={() => setSelectedPackage(pkg.id)}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                  selectedPackage === pkg.id ? "border-[#252423] bg-[#F9F7F5]" : "border-[#E8DDD2]"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                 <h4 className="font-bold text-lg">{pkg.name}</h4>
                 {pkg.isPopular && <span className="bg-[#FFDFA7] text-[#B9401D] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popular</span>}
                </div>
                <p className="text-2xl font-extrabold">{pkg.price}</p>
                {selectedPackage === pkg.id && (
                  <div className="mt-4 pt-4 space-y-3 border-t border-[#E8DDD2]">
                    {pkg.features.map((feat, i) => (
                      <div key={i} className="flex gap-3 text-sm font-medium">
                        <Check className="w-5 h-5 text-[#B9401D] flex-shrink-0" /> {feat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-32">
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8E4DC] px-6 py-4 text-base font-extrabold text-[#252423]"
          >
            <MessageSquare className="h-5 w-5" />
            Chat with Vendor
          </button>
        </div>

        <div className="fixed bottom-[5.5rem] left-0 right-0 z-40 border-t border-[#E8DDD2] bg-white p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mx-auto max-w-[420px]">
            <div>
              <p className="text-[1.3rem] font-extrabold text-[#252423]">{getPackage().price}</p>
              <p className="text-xs font-extrabold underline text-[#5E6588]">{getPackage().name}</p>
            </div>
            <button className="rounded-full bg-[#B9401D] px-8 py-3.5 text-[0.95rem] font-extrabold text-white">
              Request to Book
            </button>
          </div>
        </div>

        <MobileDock />
        <HomeFooter />
      </section>

      {/* TABLET */}
      <section className="hidden md:block xl:hidden w-full">
        <DesktopExploreHeader handleSearch={() => {}} form={form} isPending={false} filter={false} />
        <TabletPhotoGallery gallery={SERVICE_DETAILS.gallery} name={SERVICE_DETAILS.name} />

        <div className="mx-auto grid grid-cols-[minmax(0,1fr)_20rem] gap-10 px-8 py-12">
          <div>
            {renderServiceInfo("tablet")}
          </div>
          {renderAside()}
        </div>

        <HomeFooter />
      </section>

      {/* DESKTOP */}
      <section className="hidden xl:flex">
        <SideNavBar />
        <div className="ml-[15%] w-[85%] flex flex-col">
          <DesktopExploreHeader handleSearch={() => {}} form={form} isPending={false} filter={false} />

          <div className="flex flex-1">
            <div className="flex-1 px-8 pb-12 pt-10">
              <DesktopPhotoGallery gallery={SERVICE_DETAILS.gallery} name={SERVICE_DETAILS.name} />
              
              <div className="grid grid-cols-[minmax(0,1fr)_20rem] gap-20 pr-8 py-12">
                <div>
                  {renderServiceInfo("desktop")}
                </div>
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

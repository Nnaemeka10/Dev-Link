"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import Link from "next/link";
import { useHomeListings } from "../hooks/useHomeListings";
import type { HomeListingCard } from "../types/listings.types";

const CURATED_SERVICES_CONTENT = {
  heading: "Curated Event Services",
  subheading: "Top-rated professionals for your special day.",
  ctaLabel: "Explore all services",
  ctaLink: "/listings?category=services",
};

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function ListingImage({ service }: { service: HomeListingCard }) {
  const imageUrl = service.primaryImage?.thumbnailUrl ?? service.primaryImage?.url;

  if (!imageUrl) {
    return (
      <div className="text-text-primary/45 flex h-62.5 w-full items-center justify-center bg-[#EFE7DE] text-sm font-semibold">
        No image
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={service.title}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 270px, 25vw"
    />
  );
}

function CuratedServicesSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="min-w-67.5 md:min-w-0">
          <div className="bg-text-primary/8 h-62.5 animate-pulse rounded-2xl" />
          <div className="bg-text-primary/8 mt-3 h-5 w-2/3 animate-pulse rounded" />
        </div>
      ))}
    </>
  );
}

export default function CuratedServicesSection() {
  const { data, isError, isPending } = useHomeListings();
  const services = data?.curatedServices ?? [];

  return (
    <section className="px-4 py-10 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between md:mb-7 md:items-end">
          <div>
            <h2 className="text-heading-m text-text-primary leading-tight font-semibold md:text-4xl">
              {CURATED_SERVICES_CONTENT.heading}
            </h2>
            <p className="text-small text-text-primary/62 mt-2 md:text-base">
              {CURATED_SERVICES_CONTENT.subheading}
            </p>
          </div>
          <Link
            href={CURATED_SERVICES_CONTENT.ctaLink}
            className="text-small text-text-primary font-semibold underline md:text-sm"
          >
            {CURATED_SERVICES_CONTENT.ctaLabel}
          </Link>
        </div>

        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
          {isPending && <CuratedServicesSkeleton />}

          {isError && (
            <p className="text-text-primary/65 col-span-full rounded-2xl bg-white p-6 text-sm font-medium shadow-sm">
              Curated services are unavailable right now.
            </p>
          )}

          {!isPending && !isError && services.length === 0 && (
            <p className="text-text-primary/65 col-span-full rounded-2xl bg-white p-6 text-sm font-medium shadow-sm">
              No curated services available yet.
            </p>
          )}

          {!isPending &&
            !isError &&
            services.map((service, index) => (
              <article
                key={service.id}
                className="motion-safe:animate-fade-up min-w-67.5 md:min-w-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative h-62.5 overflow-hidden rounded-2xl">
                  <ListingImage service={service} />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent p-3 text-white">
                    <p className="text-tiny font-bold tracking-widest text-white/75 uppercase">
                      {service.headline ?? "Event service"}
                    </p>
                    <h3 className="text-xl leading-none font-semibold">{service.title}</h3>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-text-primary text-base font-semibold">
                    {formatNaira(service.priceFrom)}
                    <span className="text-text-primary/60 ml-1 text-sm font-normal">
                      /{service.priceUnit}
                    </span>
                  </p>
                  <p className="inline-flex items-center gap-1 rounded-full bg-[#F6E9BE] px-2 py-1 text-xs font-semibold text-[#7E6000]">
                    <Star className="h-3 w-3 fill-current" />
                    {service.rating.toFixed(1)}
                  </p>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}

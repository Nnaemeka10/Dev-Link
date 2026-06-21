"use client";

import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useHomeListings } from "../hooks/useHomeListings";
import type { HomeListingCard } from "../types/listings.types";

const POPULAR_HALLS_CONTENT = {
  heading: "Popular Event Halls",
  subheading: "Experience Nigeria's most prestigious venues.",
  ctaLabel: "View all halls",
  ctaLink: "/listings?category=halls",
};

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function ListingImage({ hall }: { hall: HomeListingCard }) {
  const imageUrl = hall.primaryImage?.thumbnailUrl ?? hall.primaryImage?.url;

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
      alt={hall.title}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 270px, 25vw"
    />
  );
}

function PopularHallsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="min-w-67.5 md:min-w-0">
          <div className="bg-text-primary/8 h-62.5 animate-pulse rounded-2xl" />
          <div className="bg-text-primary/8 mt-3 h-5 w-4/5 animate-pulse rounded" />
          <div className="bg-text-primary/8 mt-2 h-4 w-1/2 animate-pulse rounded" />
          <div className="bg-text-primary/8 mt-3 h-5 w-1/3 animate-pulse rounded" />
        </div>
      ))}
    </>
  );
}

export default function PopularHallsSection() {
  const { data, isError, isPending } = useHomeListings();
  const halls = data?.popularHalls ?? [];

  return (
    <section className="px-4 py-10 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between md:mb-7 md:items-end">
          <div>
            <h2 className="text-heading-m text-text-primary leading-tight font-semibold md:text-4xl">
              {POPULAR_HALLS_CONTENT.heading}
            </h2>
            <p className="text-small text-text-primary/62 mt-2 md:text-base">
              {POPULAR_HALLS_CONTENT.subheading}
            </p>
          </div>
          <Link
            href={POPULAR_HALLS_CONTENT.ctaLink}
            className="text-small text-text-primary font-semibold underline md:text-sm"
          >
            {POPULAR_HALLS_CONTENT.ctaLabel}
          </Link>
        </div>

        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
          {isPending && <PopularHallsSkeleton />}

          {isError && (
            <p className="text-text-primary/65 col-span-full rounded-2xl bg-white p-6 text-sm font-medium shadow-sm">
              Popular halls are unavailable right now.
            </p>
          )}

          {!isPending && !isError && halls.length === 0 && (
            <p className="text-text-primary/65 col-span-full rounded-2xl bg-white p-6 text-sm font-medium shadow-sm">
              No popular halls available yet.
            </p>
          )}

          {!isPending &&
            !isError &&
            halls.map((hall, index) => (
              <article
                key={hall.id}
                className="motion-safe:animate-fade-up min-w-67.5 md:min-w-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative h-62.5 overflow-hidden rounded-2xl">
                  <ListingImage hall={hall} />
                  <span className="text-text-primary absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-[0.55rem] font-semibold tracking-[0.08em] uppercase md:text-[0.625rem]">
                    Verified
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <h3 className="text-text-primary text-lg font-semibold">{hall.title}</h3>
                  <p className="text-small text-text-primary inline-flex items-center gap-1 font-semibold">
                    <Star className="text-accent-secondary h-4 w-4 fill-current" />
                    {hall.rating.toFixed(1)}
                  </p>
                </div>

                <p className="text-tiny text-text-primary/58 mt-1 inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {hall.location}
                </p>

                <p className="text-text-primary mt-2 text-base font-semibold">
                  {formatNaira(hall.priceFrom)}
                  <span className="text-text-primary/60 ml-1 text-sm font-normal">
                    /{hall.priceUnit}
                  </span>
                </p>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}

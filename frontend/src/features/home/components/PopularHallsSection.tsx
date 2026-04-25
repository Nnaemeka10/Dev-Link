"use client";

import Image, { type StaticImageData } from "next/image";
import { MapPin, Star } from "lucide-react";
import popularA from "@/assets/home/populareventsa.png";
import popularB from "@/assets/home/populareventsb.png";
import popularC from "@/assets/home/populareventsc.png";
import popularD from "@/assets/home/populareventsd.png";

interface HallItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  pricePerDay: string;
  image: StaticImageData;
}

interface PopularHallsResponse {
  heading: string;
  subheading: string;
  ctaLabel: string;
  data: HallItem[];
}

const POPULAR_HALLS_RESPONSE: PopularHallsResponse = {
  heading: "Popular Event Halls",
  subheading: "Experience Nigeria's most prestigious venues.",
  ctaLabel: "View all halls",
  data: [
    {
      id: "hall-1",
      name: "Grand Ballroom, Oriental",
      location: "Victoria Island, Lagos",
      rating: 4.9,
      pricePerDay: "₦1,200,000",
      image: popularA,
    },
    {
      id: "hall-2",
      name: "The Glass House",
      location: "Central Area, Abuja",
      rating: 4.8,
      pricePerDay: "₦850,000",
      image: popularB,
    },
    {
      id: "hall-3",
      name: "Civic Center Pavilion",
      location: "GRA, Port Harcourt",
      rating: 4.7,
      pricePerDay: "₦600,000",
      image: popularC,
    },
    {
      id: "hall-4",
      name: "The Landmark Marquee",
      location: "Oniru, Lagos",
      rating: 4.9,
      pricePerDay: "₦2,500,000",
      image: popularD,
    },
  ],
};

export default function PopularHallsSection() {
  return (
    <section className="px-4 py-10 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between md:mb-7">
          <div>
            <h2 className="text-heading-m font-semibold leading-tight text-text-primary md:text-[44px]">
              {POPULAR_HALLS_RESPONSE.heading}
            </h2>
            <p className="mt-2 text-small text-text-primary/62 md:text-base">
              {POPULAR_HALLS_RESPONSE.subheading}
            </p>
          </div>
          <button type="button" className="hidden text-sm font-semibold text-text-primary underline md:block">
            {POPULAR_HALLS_RESPONSE.ctaLabel}
          </button>
        </div>

        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
          {POPULAR_HALLS_RESPONSE.data.map((hall, index) => (
            <article
              key={hall.id}
              className="min-w-[270px] md:min-w-0 motion-safe:animate-[var(--animate-fade-up)]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative overflow-hidden rounded-2xl">
                <Image src={hall.image} alt={hall.name} className="h-[250px] w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-primary">
                  Verified
                </span>
              </div>

              <div className="mt-3 flex items-start justify-between gap-2">
                <h3 className="text-heading-m font-semibold text-text-primary md:text-xl">{hall.name}</h3>
                <p className="inline-flex items-center gap-1 text-small font-semibold text-text-primary md:text-sm">
                  <Star className="h-4 w-4 fill-current text-accent-secondary" />
                  {hall.rating.toFixed(1)}
                </p>
              </div>

              <p className="mt-1 inline-flex items-center gap-1 text-small text-text-primary/58 md:text-sm">
                <MapPin className="h-4 w-4" />
                {hall.location}
              </p>

              <p className="mt-2 text-heading-m font-semibold text-text-primary md:text-[22px]">
                {hall.pricePerDay}
                <span className="ml-1 text-small font-normal text-text-primary/60 md:text-sm">day</span>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

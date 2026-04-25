"use client";

import Image, { type StaticImageData } from "next/image";
import { Flame } from "lucide-react";
import trendingA from "@/assets/home/trendinghallsa.png";
import trendingB from "@/assets/home/trendinghallsb.png";
import hottestA from "@/assets/home/hottestservicea.png";
import hottestB from "@/assets/home/hottestserviceb.png";

interface RankedItem {
  id: string;
  title: string;
  meta: string;
  priceLine: string;
  image: StaticImageData;
}

interface TrendingResponse {
  bannerTitle: string;
  bannerSubtitle: string;
  trendingHalls: RankedItem[];
  hottestServices: RankedItem[];
}

const TRENDING_RESPONSE: TrendingResponse = {
  bannerTitle: "Night of Bliss MCs",
  bannerSubtitle: "Elevating your event experience",
  trendingHalls: [
    {
      id: "hall-trend-1",
      title: "The Garden Events",
      meta: "14 bookings this week",
      priceLine: "₦250k / day",
      image: trendingA,
    },
    {
      id: "hall-trend-2",
      title: "Skyline Rooftop Lounge",
      meta: "9 bookings this week",
      priceLine: "₦400k / day",
      image: trendingB,
    },
  ],
  hottestServices: [
    {
      id: "service-hot-1",
      title: "Royal Decor Hub",
      meta: "★ 5.0 (124 reviews)",
      priceLine: "Decor & styling",
      image: hottestA,
    },
    {
      id: "service-hot-2",
      title: "Gourmet Treats Catering",
      meta: "★ 4.8 (89 reviews)",
      priceLine: "Catering services",
      image: hottestB,
    },
  ],
};

function RankedBlock({ title, items }: { title: string; items: RankedItem[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <h3 className="text-heading-m font-semibold text-text-primary md:text-[38px]">{title}</h3>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="flex items-center gap-3">
            <Image src={item.image} alt={item.title} className="h-16 w-16 rounded-xl object-cover" />
            <div>
              <p className="text-heading-m font-semibold text-text-primary md:text-xl">{item.title}</p>
              <p className="text-small uppercase tracking-[0.08em] text-text-primary/48 md:text-xs">{item.meta}</p>
              <p className="text-small font-semibold text-accent-primary md:text-sm">{item.priceLine}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function TrendingSection() {
  return (
    <section className="px-4 pb-24 pt-8 md:px-8 md:pb-20 md:pt-10">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,_#123C78_0%,_#06122A_60%,_#050912_100%)] p-8 text-center text-white motion-safe:animate-[var(--animate-fade-up)]">
          <p className="text-small font-semibold uppercase tracking-[0.18em] text-[#6FA5FF] md:text-xs">Trending</p>
          <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-[#CF8658] px-4 py-2 text-small font-semibold uppercase tracking-[0.08em] text-white md:text-xs">
            <Flame className="h-3 w-3" />
            Hottest service
          </div>
          <h2 className="mt-5 text-heading-m font-semibold leading-tight md:text-[56px]">
            {TRENDING_RESPONSE.bannerTitle}
          </h2>
          <p className="mt-3 text-small text-white/78 md:text-xl">{TRENDING_RESPONSE.bannerSubtitle}</p>
        </div>

        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-6">
          <RankedBlock title="Trending Halls" items={TRENDING_RESPONSE.trendingHalls} />
          <RankedBlock title="Hottest Services" items={TRENDING_RESPONSE.hottestServices} />
        </div>
      </div>
    </section>
  );
}

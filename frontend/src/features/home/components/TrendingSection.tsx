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
      <h3 className="text-xl font-semibold text-text-primary md:text-2xl">{title}</h3>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="flex items-center gap-3">
            <Image src={item.image} alt={item.title} className="h-16 w-16 rounded-xl object-cover" />
            <div>
              <p className="font-semibold text-text-primary text-base">{item.title}</p>
              <p className="text-micro uppercase tracking-[0.08em] text-text-primary/48">{item.meta}</p>
              <p className="text-xs font-semibold text-accent-primary">{item.priceLine}</p>
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
        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-6">
          <RankedBlock title="Trending Halls" items={TRENDING_RESPONSE.trendingHalls} />
          <RankedBlock title="Hottest Services" items={TRENDING_RESPONSE.hottestServices} />
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useHomeListings } from "../hooks/useHomeListings";
import type { HomeTrendingCard } from "../types/listings.types";

interface RankedItem {
  id: string;
  title: string;
  meta: string;
  priceLine: string;
  imageUrl: string | null;
}

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function toRankedItem(item: HomeTrendingCard): RankedItem {
  return {
    id: item.id,
    title: item.title,
    meta: item.headline ?? `${Math.round(item.rankScore)} trend score`,
    priceLine: `${formatNaira(item.priceFrom)} / ${item.priceUnit}`,
    imageUrl: item.primaryImage?.thumbnailUrl ?? item.primaryImage?.url ?? null,
  };
}

function RankedImage({ item }: { item: RankedItem }) {
  if (!item.imageUrl) {
    return (
      <div className="text-text-primary/45 flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#EFE7DE] text-[0.65rem] font-semibold">
        No image
      </div>
    );
  }

  return (
    <Image
      src={item.imageUrl}
      alt={item.title}
      width={64}
      height={64}
      className="h-16 w-16 rounded-xl object-cover"
      sizes="64px"
    />
  );
}

function RankedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="bg-text-primary/8 h-16 w-16 animate-pulse rounded-xl" />
          <div className="flex-1">
            <div className="bg-text-primary/8 h-4 w-2/3 animate-pulse rounded" />
            <div className="bg-text-primary/8 mt-2 h-3 w-1/2 animate-pulse rounded" />
            <div className="bg-text-primary/8 mt-2 h-3 w-1/3 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RankedBlock({
  title,
  items,
  isError,
  isPending,
}: {
  title: string;
  items: RankedItem[];
  isError: boolean;
  isPending: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <h3 className="text-text-primary text-xl font-semibold md:text-2xl">{title}</h3>
      <div className="mt-5 space-y-4">
        {isPending && <RankedSkeleton />}
        {isError && (
          <p className="text-text-primary/65 text-sm font-medium">
            Trending listings are unavailable.
          </p>
        )}
        {!isPending && !isError && items.length === 0 && (
          <p className="text-text-primary/65 text-sm font-medium">No trending listings yet.</p>
        )}
        {items.map((item) => (
          <article key={item.id} className="flex items-center gap-3">
            <RankedImage item={item} />
            <div>
              <p className="text-text-primary text-base font-semibold">{item.title}</p>
              <p className="text-micro text-text-primary/48 tracking-[0.08em] uppercase">
                {item.meta}
              </p>
              <p className="text-accent-primary text-xs font-semibold">{item.priceLine}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function TrendingSection() {
  const { data, isError, isPending } = useHomeListings();
  const trendingHalls = data?.trendingHalls.map(toRankedItem) ?? [];
  const hottestServices = data?.trendingServices.map(toRankedItem) ?? [];

  return (
    <section className="px-4 pt-8 pb-24 md:px-8 md:pt-10 md:pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-6">
          <RankedBlock
            title="Trending Halls"
            items={trendingHalls}
            isError={isError}
            isPending={isPending}
          />
          <RankedBlock
            title="Hottest Services"
            items={hottestServices}
            isError={isError}
            isPending={isPending}
          />
        </div>
      </div>
    </section>
  );
}

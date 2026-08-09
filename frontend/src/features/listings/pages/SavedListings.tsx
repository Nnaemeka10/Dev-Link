
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Star, MapPin, Trash2, ArrowRight,
  BookmarkX, SlidersHorizontal,
} from "lucide-react";
import SideNavBar from "@/components/layout/SideNavBar";
import MobileDock from "@/components/layout/MobileDock";

import { useSavedListings, useRemoveSavedListing } from "@/features/listings/hooks/useSavedListings";
import type { SavedListingCard } from "@/features/listings/listings.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SavedCategory = "halls" | "services";

export interface SavedListing {
  id: string;
  category: SavedCategory;
  name: string;
  location: string;
  city: string;
  priceAmount: number;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  tags?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

// Adapter to map Backend ListingCard to Frontend SavedListing
function mapToSavedListing(item: SavedListingCard): SavedListing {
  const cityMatch = item.location.split(",")[0]?.trim() || "Nigeria";
  return {
    id: item.id,
    category: item.category === "hall" ? "halls" : "services",
    name: item.title,
    location: cityMatch,
    city: cityMatch,
    priceAmount: item.priceFrom,
    priceUnit: item.priceUnit,
    rating: item.rating,
    reviewCount: item.reviewCount,
    imageUrl: item.primaryImage?.url || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    tags: item.badges,
  };
}

// ─── Listing card ─────────────────────────────────────────────────────────────

interface CardProps {
  listing: SavedListing;
  index: number;
  onRemove: (id: string) => void;
}

function SavedCard({ listing, index, onRemove }: CardProps) {
  const [removing, setRemoving] = useState(false);

  function handleRemove() {
    setRemoving(true);
    setTimeout(() => onRemove(listing.id), 320);
  }

  return (
    <motion.article
      custom={index}
      variants={{
        hidden: { opacity: 0, y: 22 },
        visible: (i: number) => ({
          opacity: 1, y: 0,
          transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
        }),
      }}
      initial="hidden"
      animate={removing ? { opacity: 0, scale: 0.94, y: 8 } : "visible"}
      transition={removing ? { duration: 0.3, ease: "easeIn" } : undefined}
      layout
      className="group relative flex flex-col"
    >
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl bg-surface-high">
        <Image
          src={listing.imageUrl}
          alt={listing.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        <button
          type="button"
          onClick={handleRemove}
          aria-label="Remove from saved"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white md:right-4 md:top-4"
        >
          <Heart className="h-4 w-4 fill-accent-primary text-accent-primary" />
        </button>

        <div className="absolute inset-x-0 bottom-0 hidden translate-y-full flex-col gap-0 bg-linear-to-t from-black/65 via-black/30 to-transparent p-4 transition-transform duration-300 ease-out group-hover:translate-y-0 md:flex">
          <div className="flex items-center gap-2 pt-6">
            <Link
              href={`/listings/${listing.category}/${listing.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-xs font-extrabold uppercase tracking-wide text-text-primary transition-colors hover:bg-accent-primary hover:text-white"
            >
              View Listing
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove listing"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/60 to-transparent p-3 md:hidden">
          <Link
            href={`/listings/${listing.category}/${listing.id}`}
            className="flex items-center gap-1 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold text-text-primary backdrop-blur-sm"
          >
            View
            <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove listing"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1 px-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/listings/${listing.category}/${listing.id}`}
            className="flex-1 text-base font-bold leading-snug text-text-primary hover:text-accent-primary transition-colors line-clamp-1"
          >
            {listing.name}
          </Link>
          <span className="flex shrink-0 items-center gap-1 md:text-sm text-small font-semibold text-text-primary">
            <Star className="h-3.5 w-3.5 fill-accent-secondary text-accent-secondary" />
            {listing.rating.toFixed(1)}
          </span>
        </div>

        <p className="flex items-center gap-1 md:text-sm text-small text-text-primary/55">
          <MapPin className="h-3 w-3 shrink-0" />
          {listing.location}
        </p>

        <p className="pt-1 md:text-sm text-base font-bold text-text-primary">
          {formatNaira(listing.priceAmount)}
          <span className="ml-1 text-xs font-normal text-text-primary/50">
            {listing.priceUnit}
          </span>
        </p>
      </div>
    </motion.article>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ category }: { category: SavedCategory }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-[0_4px_20px_rgba(26,31,60,0.08)]">
        <BookmarkX className="h-9 w-9 text-text-primary/25" />
      </div>
      <h3 className="font-man text-xl font-bold text-text-primary">
        No saved {category === "halls" ? "venues" : "services"} yet
      </h3>
      <p className="mt-2 max-w-xs text-sm text-text-primary/50">
        Tap the heart on any listing to save it here for later.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-accent-primary px-6 py-3 text-sm font-extrabold text-white transition hover:brightness-95"
      >
        Explore {category === "halls" ? "venues" : "services"}
      </Link>
    </motion.div>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

interface SavedContentProps {
  category: SavedCategory;
  setCategory: (c: SavedCategory) => void;
  saved: SavedListing[];
  filtered: SavedListing[];
  hallCount: number;
  serviceCount: number;
  handleRemove: (id: string) => void;
  startTransition: (cb: () => void) => void;
  isLoading: boolean;
}

function SavedContent({
  category, setCategory, saved, filtered, hallCount, serviceCount, handleRemove, startTransition, isLoading
}: SavedContentProps) {
  return (
    <>
      <header className="mb-10 flex gap-6 flex-row items-end justify-between">
        <div>
          <p className="mb-1 md:text-xs text-tiny font-extrabold uppercase tracking-[0.18em] text-accent-primary">
            Your Collection
          </p>
          <h1 className="font-man text-heading-m font-extrabold leading-tight tracking-tight text-text-primary md:text-5xl">
            Saved Listings
          </h1>
          <p className="mt-2 md:text-sm text-tiny text-text-primary/50">
            {!isLoading && `${saved.length} ${saved.length === 1 ? "listing" : "listings"} saved`}
          </p>
        </div>

        <button
          type="button"
          className="flex w-fit items-center gap-2 rounded-full border border-text-primary/12 bg-white md:px-4 px-2 py-2.5 md:text-sm text-micro font-semibold text-text-primary/70 shadow-sm transition hover:shadow-md"
        >
          <SlidersHorizontal className="md:h-4 md:w-4 h-3 w-3" />
          Sort & Filter
        </button>
      </header>

      <div className="mb-8 flex justify-between gap-0 border-b border-text-primary/8">
        {(["halls", "services"] as SavedCategory[]).map((cat) => {
          const isActive = category === cat;
          const count = cat === "halls" ? hallCount : serviceCount;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => startTransition(() => setCategory(cat))}
              className={[
                "relative px-5 py-3 md:text-sm text-small font-semibold transition-colors",
                isActive ? "text-text-primary" : "text-text-primary/45 hover:text-text-primary/70",
              ].join(" ")}
            >
              {cat === "halls" ? "Event Halls" : "Services"}
              {count > 0 && (
                <span
                  className={[
                    "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-tiny font-extrabold",
                    isActive ? "bg-accent-primary text-white" : "bg-text-primary/8 text-text-primary/50",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="saved-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-4/5 w-full animate-pulse rounded-3xl bg-[#e6e3dc]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState key={`empty-${category}`} category={category} />
        ) : (
          <motion.div
            key={category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((listing, i) => (
              <SavedCard
                key={listing.id}
                listing={listing}
                index={i}
                onRemove={handleRemove}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileSavedView(props: SavedContentProps) {
  return (
    <section className="flex flex-col md:hidden min-h-screen bg-bg-primary pb-32">
      <div className="px-4 pt-8 pb-10">
        <SavedContent {...props} />
      </div>
      <MobileDock />
    </section>
  );
}

function TabletSavedView(props: SavedContentProps) {
  return (
    <section className="hidden md:flex xl:hidden flex-col min-h-screen bg-bg-primary pb-32">
      <div className="px-10 lg:px-14 pt-8 pb-10">
        <SavedContent {...props} />
      </div>
      <MobileDock />
    </section>
  );
}

function DesktopSavedView(props: SavedContentProps) {
  return (
    <section className="hidden xl:flex min-h-screen bg-bg-primary">
      <SideNavBar />
      <div className="w-[85%] ml-[15%]">
        <div className="px-4 pb-28 pt-8 md:px-10 lg:px-14 xl:px-16">
          <SavedContent {...props} />
        </div>
      </div>
    </section>
  );
}

export default function SavedPage() {
  const [category, setCategory] = useState<SavedCategory>("halls");
  const [, startTransition] = useTransition();
  
  const { data: apiData = [], isLoading } = useSavedListings();
  const removeMutation = useRemoveSavedListing();

  // Map backend payload to frontend UI shape
  const saved = apiData.map(mapToSavedListing);

  const filtered = saved.filter((l) => l.category === category);

  function handleRemove(id: string) {
    startTransition(() => {
      removeMutation.mutate(id);
    });
  }

  const hallCount = saved.filter((l) => l.category === "halls").length;
  const serviceCount = saved.filter((l) => l.category === "services").length;

  const contentProps = {
    category,
    setCategory,
    saved,
    filtered,
    hallCount,
    serviceCount,
    handleRemove,
    startTransition,
    isLoading,
  };

  return (
    <main className="text-text-primary">
      <MobileSavedView {...contentProps} />
      <TabletSavedView {...contentProps} />
      <DesktopSavedView {...contentProps} />
    </main>
  );
}
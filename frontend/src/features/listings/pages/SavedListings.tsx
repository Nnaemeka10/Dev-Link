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

// ─── Mock data — swap for your API / React Query call ────────────────────────
// Shape mirrors: GET /api/saved?userId=...
// Replace this block with: const { data } = useQuery({ queryKey: ['saved'], queryFn: fetchSaved })

const MOCK_SAVED: SavedListing[] = [
  {
    id: "1",
    category: "halls",
    name: "The Grand Onyx Pavilion",
    location: "Victoria Island",
    city: "Lagos",
    priceAmount: 2_500_000,
    priceUnit: "/ day",
    rating: 4.9,
    reviewCount: 218,
    imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    tags: ["Crystal Chandeliers", "Marble Floors"],
  },
  {
    id: "2",
    category: "halls",
    name: "Civic Center Glass House",
    location: "Ikoyi",
    city: "Lagos",
    priceAmount: 1_800_000,
    priceUnit: "/ day",
    rating: 4.8,
    reviewCount: 144,
    imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
    tags: ["Floor-to-Ceiling Windows", "Industrial"],
  },
  {
    id: "3",
    category: "halls",
    name: "The Heritage Garden",
    location: "Maitama",
    city: "Abuja",
    priceAmount: 950_000,
    priceUnit: "/ day",
    rating: 4.7,
    reviewCount: 89,
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
    tags: ["Outdoor", "Garden"],
  },
  {
    id: "4",
    category: "halls",
    name: "Legacy Manor Estate",
    location: "GRA",
    city: "Port Harcourt",
    priceAmount: 1_200_000,
    priceUnit: "/ day",
    rating: 4.9,
    reviewCount: 176,
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    tags: ["Colonial", "Manicured Lawns"],
  },
  {
    id: "5",
    category: "halls",
    name: "Skyline Terrace",
    location: "Lekki Phase 1",
    city: "Lagos",
    priceAmount: 750_000,
    priceUnit: "/ day",
    rating: 4.6,
    reviewCount: 63,
    imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
    tags: ["Rooftop", "Cocktail Bar"],
  },
  {
    id: "6",
    category: "services",
    name: "DJ Spinall",
    location: "Lagos",
    city: "NG",
    priceAmount: 450_000,
    priceUnit: "/ set",
    rating: 5.0,
    reviewCount: 312,
    imageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
    tags: ["Premium Sound", "Contract Available"],
  },
  {
    id: "7",
    category: "services",
    name: "Bloom Decor Studio",
    location: "Lekki Phase 1",
    city: "Lagos",
    priceAmount: 320_000,
    priceUnit: "/ event",
    rating: 4.9,
    reviewCount: 141,
    imageUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&q=80",
    tags: ["Floral Design", "Setup Included"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

// ─── Card stagger variants ────────────────────────────────────────────────────

const cardVariants = {
  hidden:  { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { 
        delay: i * 0.07, 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1] as const 
    },
  }),
};

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
    // Small delay so the animation plays before the item leaves the list
    setTimeout(() => onRemove(listing.id), 320);
  }

  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={removing ? { opacity: 0, scale: 0.94, y: 8 } : "visible"}
      transition={removing ? { duration: 0.3, ease: "easeIn" } : undefined}
      layout
      className="group relative flex flex-col"
    >
      {/* ── Image container ─────────────────────────────────────────────── */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[#ebe8e1]">
        <Image
          src={listing.imageUrl}
          alt={listing.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* ── Always-visible heart (desktop + mobile) ───────────────────── */}
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Remove from saved"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white md:right-4 md:top-4"
        >
          <Heart className="h-4 w-4 fill-[#d65c3a] text-[#d65c3a]" />
        </button>

        {/* ── Desktop hover overlay ─────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 hidden translate-y-full flex-col gap-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent p-4 transition-transform duration-300 ease-out group-hover:translate-y-0 md:flex">
          <div className="flex items-center gap-2 pt-6">
            <Link
              href={`/listing/${listing.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-xs font-extrabold uppercase tracking-wide text-[#1a1f3c] transition-colors hover:bg-[#d65c3a] hover:text-white"
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

        {/* ── Mobile always-visible bottom bar ─────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-3 md:hidden">
          <Link
            href={`/listing/${listing.id}`}
            className="flex items-center gap-1 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold text-[#1a1f3c] backdrop-blur-sm"
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

      {/* ── Card info ────────────────────────────────────────────────────── */}
      <div className="mt-3 space-y-1 px-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/listing/${listing.id}`}
            className="flex-1 text-base font-bold leading-snug text-[#1a1f3c] hover:text-[#d65c3a] transition-colors line-clamp-1"
          >
            {listing.name}
          </Link>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[#1a1f3c]">
            <Star className="h-3.5 w-3.5 fill-[#c9993a] text-[#c9993a]" />
            {listing.rating.toFixed(1)}
          </span>
        </div>

        <p className="flex items-center gap-1 text-sm text-[#1a1f3c]/55">
          <MapPin className="h-3 w-3 shrink-0" />
          {listing.location}, {listing.city}
        </p>

        <p className="pt-1 text-sm font-bold text-[#1a1f3c]">
          {formatNaira(listing.priceAmount)}
          <span className="ml-1 text-xs font-normal text-[#1a1f3c]/50">
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
        <BookmarkX className="h-9 w-9 text-[#1a1f3c]/25" />
      </div>
      <h3 className="font-man text-xl font-bold text-[#1a1f3c]">
        No saved {category === "halls" ? "venues" : "services"} yet
      </h3>
      <p className="mt-2 max-w-xs text-sm text-[#1a1f3c]/50">
        Tap the heart on any listing to save it here for later.
      </p>
      <Link
        href="/explore"
        className="mt-6 rounded-full bg-[#d65c3a] px-6 py-3 text-sm font-extrabold text-white transition hover:brightness-95"
      >
        Explore {category === "halls" ? "venues" : "services"}
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────




interface SavedContentProps {
  category: SavedCategory;
  setCategory: (c: SavedCategory) => void;
  saved: SavedListing[];
  filtered: SavedListing[];
  hallCount: number;
  serviceCount: number;
  handleRemove: (id: string) => void;
  startTransition: (cb: () => void) => void;
}

function SavedContent({
  category,
  setCategory,
  saved,
  filtered,
  hallCount,
  serviceCount,
  handleRemove,
  startTransition,
}: SavedContentProps) {
  return (
    <>
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#d65c3a]">
            Your Collection
          </p>
          <h1 className="font-man text-4xl font-extrabold leading-tight tracking-tight text-[#1a1f3c] md:text-5xl">
            Saved Listings
          </h1>
          <p className="mt-2 text-sm text-[#1a1f3c]/50">
            {saved.length} {saved.length === 1 ? "listing" : "listings"} saved
          </p>
        </div>

        <button
          type="button"
          className="flex w-fit items-center gap-2 rounded-full border border-[#1a1f3c]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1f3c]/70 shadow-sm transition hover:shadow-md"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Sort & Filter
        </button>
      </header>

      <div className="mb-8 flex gap-0 border-b border-[#1a1f3c]/8">
        {(["halls", "services"] as SavedCategory[]).map((cat) => {
          const isActive = category === cat;
          const count = cat === "halls" ? hallCount : serviceCount;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => startTransition(() => setCategory(cat))}
              className={[
                "relative px-5 py-3 text-sm font-semibold transition-colors",
                isActive
                  ? "text-[#1a1f3c]"
                  : "text-[#1a1f3c]/45 hover:text-[#1a1f3c]/70",
              ].join(" ")}
            >
              {cat === "halls" ? "Event Halls" : "Services"}
              {count > 0 && (
                <span
                  className={[
                    "ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold",
                    isActive
                      ? "bg-[#d65c3a] text-white"
                      : "bg-[#1a1f3c]/8 text-[#1a1f3c]/50",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="saved-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#d65c3a]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
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

      {filtered.length > 0 && (
        <div className="mt-20 flex flex-col items-center gap-3">
          <button
            type="button"
            className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#1a1f3c]/15 bg-white shadow-sm transition-all hover:border-[#d65c3a] hover:bg-[#d65c3a] hover:shadow-md"
            onClick={() => {}}
          >
            <ArrowRight className="h-4 w-4 rotate-90 text-[#1a1f3c]/50 transition-colors group-hover:text-white" />
          </button>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#1a1f3c]/40">
            Load More
          </span>
        </div>
      )}
    </>
  );
}

function MobileSavedView(props: SavedContentProps) {
  return (
    <section className="flex flex-col md:hidden min-h-screen bg-[#f9f6ef] pb-32">
      <div className="px-4 pt-8 pb-10">
        <SavedContent {...props} />
      </div>
      <MobileDock />
    </section>
  );
}

function TabletSavedView(props: SavedContentProps) {
  return (
    <section className="hidden md:flex xl:hidden flex-col min-h-screen bg-[#f9f6ef] pb-32">
      <div className="px-10 lg:px-14 pt-8 pb-10">
        <SavedContent {...props} />
      </div>
      <MobileDock />
    </section>
  );
}

function DesktopSavedView(props: SavedContentProps) {
  return (
    <section className="hidden xl:flex min-h-screen bg-[#f9f6ef]">
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
  const [saved, setSaved] = useState<SavedListing[]>(MOCK_SAVED);
  const [, startTransition] = useTransition();

  const filtered = saved.filter((l) => l.category === category);

  function handleRemove(id: string) {
    startTransition(() => {
      setSaved((prev) => prev.filter((l) => l.id !== id));
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
  };

  return (
    <main className="text-[#1a1f3c]">
      <MobileSavedView {...contentProps} />
      <TabletSavedView {...contentProps} />
      <DesktopSavedView {...contentProps} />
    </main>
  );
}

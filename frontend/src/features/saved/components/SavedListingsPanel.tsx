"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookmarkX, Heart, MapPin, Star } from "lucide-react";
import { useSavedListings, useRemoveSavedListing } from "@/features/listings/hooks/useSavedListings";
import type { SavedListingCard } from "@/features/listings/listings.types";
import type { SavedKind } from "../saved.types";

const FALLBACK = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80";

function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

function SavedCard({
  item,
  index,
  onRemove,
}: {
  item: SavedListingCard;
  index: number;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const category = item.category === "hall" ? "halls" : "services";

  function handleRemove() {
    setRemoving(true);
    setTimeout(() => onRemove(item.id), 280);
  }

  return (
    <motion.article
      layout
      custom={index}
      initial={{ opacity: 0, y: 22 }}
      animate={removing ? { opacity: 0, scale: 0.94 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[#EFE7DE]">
        <Image
          src={item.primaryImage?.url || FALLBACK}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Remove from saved"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
        >
          <Heart className="h-4 w-4 fill-[#B9401D] text-[#B9401D]" />
        </button>
        <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-gradient-to-t from-black/65 via-black/25 to-transparent p-4 transition-transform duration-300 ease-out group-hover:translate-y-0 md:block">
          <Link
            href={`/listings/${category}/${item.id}`}
            className="flex items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-xs font-extrabold uppercase tracking-wide text-[#252423] transition-colors hover:bg-[#B9401D] hover:text-white"
          >
            View listing <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-extrabold text-[#252423]">{item.title}</h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#252423]">
            <Star className="h-3 w-3 fill-[#B9401D] text-[#B9401D]" />
            {item.rating.toFixed(1)}
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs font-semibold text-[#9A9AAE]">
          <MapPin className="h-3 w-3" /> {item.location}
        </p>
        <p className="mt-1 text-sm font-extrabold text-[#B9401D]">
          {formatNaira(item.priceFrom)}
          <span className="text-xs font-semibold text-[#9A9AAE]"> / {item.priceUnit}</span>
        </p>
        <Link
          href={`/listings/${category}/${item.id}`}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-full border border-[#E8DDD2] py-2 text-xs font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] md:hidden"
        >
          View listing <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </motion.article>
  );
}

export default function SavedListingsPanel() {
  const [kind, setKind] = useState<SavedKind>("halls");
  const { data, isLoading } = useSavedListings();
  const removeMutation = useRemoveSavedListing();

  const items = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () => items.filter((i) => (kind === "halls" ? i.category === "hall" : i.category === "service")),
    [items, kind]
  );
  const counts = useMemo(
    () => ({
      halls: items.filter((i) => i.category === "hall").length,
      services: items.filter((i) => i.category === "service").length,
    }),
    [items]
  );

  return (
    <div>
      {/* Halls / Services sub-tabs */}
      <div className="inline-flex rounded-full bg-[#F0E9DF] p-1">
        {(["halls", "services"] as SavedKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`relative rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors ${
              kind === k ? "text-white" : "text-[#6B5F57] hover:text-[#252423]"
            }`}
          >
            {kind === k && (
              <motion.span
                layoutId="saved-kind-pill"
                className="absolute inset-0 rounded-full bg-[#B9401D]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">
              {k} ({counts[k]})
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] rounded-3xl bg-[#EFE7DE]" />
                <div className="mt-3 h-4 w-3/4 rounded bg-[#EFE7DE]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-[#EFE7DE]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-[2rem] border border-dashed border-[#E0D5C7] bg-white/60 px-6 py-16 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
              <BookmarkX className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-extrabold text-[#252423]">No saved {kind} yet</h3>
            <p className="mt-1 max-w-xs text-sm font-semibold text-[#9A9AAE]">
              Tap the heart on any {kind === "halls" ? "hall" : "service"} to keep it here for later.
            </p>
            <Link
              href={`/listings?category=${kind}`}
              className="mt-6 rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white transition hover:brightness-95"
            >
              Explore {kind}
            </Link>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <SavedCard
                  key={item.id}
                  item={item}
                  index={i}
                  onRemove={(id) => removeMutation.mutate(id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
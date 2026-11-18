"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  CloudOff,
  EyeOff,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import VendorPageShell from "../components/VendorPageShell";
import ListingStatusBadge, {
  PendingEditsBadge,
} from "../components/ListingStatusBadge";
import ListingActionDialog, {
  type ListingActionKind,
} from "../components/ListingActionDialog";
import {
  useMyListingsStats,
  useVendorListings,
  vendorKeys,
} from "../hooks/useVendorDashboard";
import type { VendorListing } from "../types";
import { EASE_OUT } from "../utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80";

/** Post-publish / post-save feedback carried over from the wizard. */
const NOTICES: Record<string, { tone: "success" | "info"; message: string }> = {
  published: { tone: "success", message: "Listing published - it's now live in search." },
  staged: {
    tone: "info",
    message: "Changes submitted for review. Your current listing stays live until they're approved.",
  },
  relisted: { tone: "success", message: "Listing relisted - it's back in search." },
  "changes-saved": { tone: "info", message: "Changes saved. Publish them whenever you're ready." },
  "draft-saved": { tone: "success", message: "Draft saved. Pick it up any time." },
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function imageFor(listing: VendorListing) {
  const url = listing.thumbnailUrl;
  return url && !url.startsWith("/placeholder") ? url : FALLBACK_IMAGE;
}

function editLabel(listing: VendorListing) {
  if (listing.status === "draft") return "Continue";
  if (listing.status === "rejected") return "Fix & resubmit";
  return "Edit";
}

function StatCard({
  label,
  value,
  tone,
  delay,
  suffix,
}: {
  label: string;
  value: string;
  tone: string;
  delay: number;
  suffix?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
      className="rounded-2xl bg-surface-low p-5 transition-colors duration-300 hover:bg-surface-high md:p-6"
    >
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted md:text-xs">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className={`font-headline text-2xl font-black tabular-nums md:text-3xl ${tone}`}>
          {value}
        </p>
        {suffix}
      </div>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#F0E9DF] bg-white">
      <div className="aspect-4/3 animate-pulse bg-[#EFE7DE]" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-[#EFE7DE]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#EFE7DE]" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-[#EFE7DE]" />
        <div className="h-11 w-full animate-pulse rounded-full bg-[#EFE7DE]" />
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="w-full">
      <div className="mb-8 h-10 w-56 animate-pulse rounded-full bg-[#EFE7DE]" />
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#EFE7DE]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  index,
  onEdit,
  onAction,
}: {
  listing: VendorListing;
  index: number;
  onEdit: (listing: VendorListing) => void;
  onAction: (kind: ListingActionKind, listing: VendorListing) => void;
}) {
  const canOpen = listing.canEdit;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{
        duration: 0.42,
        delay: Math.min(index * 0.05, 0.3),
        ease: EASE_OUT,
      }}
      className="group relative flex flex-col rounded-[1.75rem] border border-[#F0E9DF] bg-white shadow-[0_10px_30px_rgba(36,28,18,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(36,28,18,0.10)]"
    >
      {/* Image + body are one large tap target; the action row below is
          separate so a tap on Delete can never also open the editor. */}
      <button
        type="button"
        onClick={() => canOpen && onEdit(listing)}
        disabled={!canOpen}
        aria-label={canOpen ? `Edit ${listing.title}` : listing.title}
        className="block w-full text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary disabled:cursor-default"
      >
        <div className="relative aspect-4/3 overflow-hidden rounded-t-[1.75rem] bg-[#EFE7DE]">
          <Image
            src={imageFor(listing)}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
            <ListingStatusBadge status={listing.status} />
            {listing.hasPendingEdits && <PendingEditsBadge />}
          </div>
        </div>

        <div className="p-5">
          <h3 className="line-clamp-1 font-headline text-lg font-bold leading-tight text-text-primary transition-colors duration-300 group-hover:text-accent-primary">
            {listing.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{listing.location}</span>
          </p>

          {listing.upcomingBookings > 0 && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFF1E6] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#B9401D]">
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              {listing.upcomingBookings} upcoming
            </span>
          )}

          <div className="mt-4 flex items-end justify-between border-t border-border-light/50 pt-4">
            <div>
              <p className="text-lg font-extrabold leading-none text-text-primary">
                {formatNaira(listing.pricePerUnit)}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                / {listing.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">
                {listing.viewsLast30Days.toLocaleString()} views
              </p>
              <p className="text-xs font-semibold text-text-primary">
                {listing.bookingsLast30Days} bookings
              </p>
            </div>
          </div>
        </div>
      </button>

      {/* Actions - always visible (no hover-only controls on touch). */}
      <div className="mt-auto flex flex-wrap gap-2 border-t border-[#F0E9DF] bg-[#FDFBF7] px-5 py-4">
        {listing.canEdit && (
          <button
            type="button"
            onClick={() => onEdit(listing)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#B9401D] px-4 text-xs font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.97]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {editLabel(listing)}
          </button>
        )}

        {listing.canUnlist && (
          <button
            type="button"
            onClick={() => onAction("unlist", listing)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[#E8DDD2] px-4 text-xs font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA] active:scale-[0.97]"
          >
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            Unlist
          </button>
        )}

        {listing.canRelist && (
          <button
            type="button"
            onClick={() => onAction("relist", listing)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-emerald-200 px-4 text-xs font-extrabold text-emerald-700 transition-colors hover:bg-emerald-50 active:scale-[0.97]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Relist
          </button>
        )}

        {listing.canDelete && (
          <button
            type="button"
            onClick={() => onAction("delete", listing)}
            aria-label={`Delete ${listing.title}`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-red-200 px-4 text-xs font-extrabold text-red-600 transition-colors hover:bg-red-50 active:scale-[0.97]"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        )}
      </div>
    </motion.article>
  );
}

function MyListingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: stats } = useMyListingsStats();
  const { data: listings, isLoading, isError, refetch } = useVendorListings();

  const [dialog, setDialog] = useState<{
    kind: ListingActionKind;
    listing: VendorListing;
  } | null>(null);
  const [flash, setFlash] = useState<{
    tone: "success" | "info" | "danger";
    message: string;
  } | null>(null);

  // Consume the wizard's hand-off notice exactly once, then clean the URL.
  const notice = searchParams.get("notice");
  const consumedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!notice) {
      consumedRef.current = null;
      return;
    }
    if (consumedRef.current === notice) return;
    consumedRef.current = notice;
    const meta = NOTICES[notice];
    if (meta) setFlash(meta);
    router.replace(pathname, { scroll: false });
  }, [notice, pathname, router]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 6000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  function refreshEverything() {
    void queryClient.invalidateQueries({ queryKey: vendorKeys.listings });
    void queryClient.invalidateQueries({ queryKey: vendorKeys.listingStats });
    // Publishing/unlisting flips the DERIVED vendor flag and public search.
    void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    void queryClient.invalidateQueries({ queryKey: ["explore"] });
    void queryClient.invalidateQueries({ queryKey: ["home", "listings"] });
    void queryClient.invalidateQueries({ queryKey: ["listing"] });
    void queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
  }

  function handleEdit(listing: VendorListing) {
    router.push(`/vendor/create-listing?edit=${listing.id}`);
  }

  function handleSuccess(kind: ListingActionKind, listing: VendorListing) {
    refreshEverything();
    setFlash({
      tone: kind === "delete" ? "danger" : "success",
      message:
        kind === "delete"
          ? `“${listing.title}” was deleted. Past bookings and records are kept.`
          : kind === "unlist"
            ? `“${listing.title}” is unlisted. Existing bookings are unaffected.`
            : `“${listing.title}” is live again.`,
    });
  }

  const items = listings ?? [];

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center md:mb-8">
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight text-text-primary md:text-4xl">
            My Listings
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Manage your event spaces and services
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/vendor/create-listing")}
          className="btn-hover-lift flex w-full items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-3.5 font-headline text-sm font-bold tracking-wide text-white shadow-lg shadow-accent-glow transition-all hover:opacity-90 active:scale-95 sm:w-auto"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Create New Listing
        </button>
      </div>

      {/* Flash */}
      <AnimatePresence initial={false}>
        {flash && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div
              role="status"
              className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold ${
                flash.tone === "danger"
                  ? "bg-red-50 text-red-700"
                  : flash.tone === "info"
                    ? "bg-[#FFF7F2] text-[#8A5A44]"
                    : "bg-[#F1F7F2] text-[#2D5A27]"
              }`}
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="flex-1">{flash.message}</p>
              <button
                type="button"
                onClick={() => setFlash(null)}
                className="shrink-0 text-xs font-extrabold uppercase tracking-wider opacity-60 transition-opacity hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <StatCard
          label="Total Listings"
          value={String(stats?.totalListings ?? 0)}
          tone="text-accent-primary"
          delay={0.04}
        />
        <StatCard
          label="Live Now"
          value={String(stats?.activeListings ?? 0)}
          tone="text-text-green"
          delay={0.08}
        />
        <StatCard
          label="Total Views"
          value={(stats?.totalViews ?? 0).toLocaleString()}
          tone="text-text-primary"
          delay={0.12}
        />
        <StatCard
          label="Avg. Rating"
          value={(stats?.avgRating ?? 0).toFixed(1)}
          tone="text-accent-secondary"
          delay={0.16}
          suffix={
            <Star
              className="h-5 w-5 fill-accent-secondary text-accent-secondary"
              aria-hidden="true"
            />
          }
        />
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError && items.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-border-light bg-surface-base px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
            <CloudOff className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-headline text-lg font-bold">
            Couldn&apos;t load your listings
          </h2>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="flex flex-col items-center justify-center rounded-3xl border border-border-light bg-surface-base px-4 py-20 text-center md:py-24"
        >
          <h2 className="mb-2 font-headline text-xl font-bold">No listings yet</h2>
          <p className="mb-6 max-w-sm text-sm text-text-muted">
            You haven&apos;t listed any venues or services yet. Create your first
            listing to start getting bookings.
          </p>
          <button
            type="button"
            onClick={() => router.push("/vendor/create-listing")}
            className="btn-hover-lift flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent-glow transition-all hover:opacity-90"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Create Your First Listing
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                index={index}
                onEdit={handleEdit}
                onAction={(kind, target) => setDialog({ kind, listing: target })}
              />
            ))}
          </AnimatePresence>

          {/* Create new card */}
          <motion.div
            layout
            className="group flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-border-light p-12 transition-all duration-500 hover:border-accent-primary/50 hover:bg-surface-low"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint transition-all duration-500 group-hover:scale-110 group-hover:bg-accent-glow">
              <Plus
                className="h-8 w-8 text-accent-primary transition-transform duration-500 group-hover:rotate-90"
                aria-hidden="true"
              />
            </div>
            <h4 className="font-headline text-lg font-bold text-text-primary">
              Add New Listing
            </h4>
            <p className="mt-2 px-6 text-center text-sm text-text-muted">
              Ready to showcase a new venue or professional service?
            </p>
            <button
              type="button"
              onClick={() => router.push("/vendor/create-listing")}
              className="btn-hover-lift mt-8 rounded-full bg-accent-primary px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-accent-glow transition-all duration-300 active:scale-95"
            >
              Get Started
            </button>
          </motion.div>
        </motion.div>
      )}

      <ListingActionDialog
        action={dialog?.kind ?? null}
        listing={dialog?.listing ?? null}
        onClose={() => setDialog(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

/**
 * One shell for every breakpoint: fixed rail on xl, the shared Navbar at the
 * top (logo + contextual client/vendor switch + user menu), bottom dock below
 * xl - identical chrome to the Today dashboard and every detail page.
 * Suspense is local so useSearchParams never breaks the route's prerender.
 */
export default function MyListingsPage() {
  return (
    <VendorPageShell>
      <Suspense fallback={<ContentSkeleton />}>
        <MyListingsContent />
      </Suspense>
    </VendorPageShell>
  );
}
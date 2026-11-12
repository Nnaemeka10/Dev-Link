"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MapPin, Star, UsersRound, X } from "lucide-react";
import type { ExploreListing } from "../../explore.types";

// --- Types ---

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The listings to compare, only the first two are used. */
  listings: ExploreListing[];
}

type CompareRow = {
  label: string;
  render: (listing: ExploreListing) => ReactNode;
};

// Shared track sizes so the column headers and every attribute row stay aligned.
const COMPARE_COLS =
  "grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)]";

// --- Helpers ---

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function listingHref(listing: ExploreListing) {
  return `/listings/${listing.kind === "venue" ? "halls" : "services"}/${listing.id}`;
}

function formatCapacity(capacity: number | null) {
  if (!capacity || capacity <= 0) return null;
  return capacity.toLocaleString();
}

function highlightChips(listing: ExploreListing) {
  // Venues lead with their hall types, everything else falls back to badges.
  const all = listing.hallTypes?.length
    ? listing.hallTypes.map((ht) => ht.label)
    : (listing.badges ?? []).map((badge) => badge.name);
  const visible = all.slice(0, 2);
  return { visible, overflow: all.length - visible.length };
}

function MissingValue() {
  return <span className="text-sm font-bold text-text-primary/25">-</span>;
}

function buildRows(a: ExploreListing, b: ExploreListing): CompareRow[] {
  const rows: CompareRow[] = [];

  rows.push({
    label: "Price",
    render: (l) => (
      <div className="flex flex-col items-center leading-tight">
        <p className="text-sm font-extrabold text-[#B33E1F] md:text-base">{formatNaira(l.priceFrom)}</p>
        <p className="mt-0.5 text-nano font-bold text-[#5E6588]">/ {l.priceUnit}</p>
      </div>
    ),
  });

  rows.push({
    label: "Location",
    render: (l) => (
      <p className="flex items-center justify-center gap-1 text-xs font-semibold text-[#252423] md:text-sm">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#B9401D]" />
        <span className="truncate">{l.location}</span>
      </p>
    ),
  });

  if (a.capacity != null || b.capacity != null) {
    rows.push({
      label: "Capacity",
      render: (l) => {
        const capacity = formatCapacity(l.capacity);
        return capacity ? (
          <p className="flex items-center justify-center gap-1 text-xs font-semibold text-[#252423] md:text-sm">
            <UsersRound className="h-3.5 w-3.5 text-[#B9401D]" />
            {capacity}
          </p>
        ) : (
          <MissingValue />
        );
      },
    });
  }

  rows.push({
    label: "Rating",
    render: (l) => (
      <p className="flex items-center justify-center gap-1 text-xs font-extrabold text-[#252423] md:text-sm">
        <Star className="h-3.5 w-3.5 fill-[#E3A700] text-[#E3A700]" />
        {l.rating.toFixed(1)}
      </p>
    ),
  });

  if (a.verified || b.verified) {
    rows.push({
      label: "Verified",
      render: (l) =>
        l.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#B9401D] px-2 py-0.5 text-nano font-extrabold uppercase tracking-[0.08em] text-white">
            <Check className="h-2.5 w-2.5" />
            Verified
          </span>
        ) : (
          <MissingValue />
        ),
    });
  }

  const chipsA = highlightChips(a);
  const chipsB = highlightChips(b);
  if (chipsA.visible.length > 0 || chipsB.visible.length > 0) {
    rows.push({
      label: "Highlights",
      render: (l) => {
        const { visible, overflow } = highlightChips(l);
        if (visible.length === 0) return <MissingValue />;
        return (
          <div className="flex flex-wrap items-center justify-center gap-1">
            {visible.map((label) => (
              <span
                key={label}
                className="rounded-full bg-[#EEECE7] px-2 py-1 text-nano font-extrabold uppercase tracking-[0.06em] text-[#7A7C94]"
              >
                {label}
              </span>
            ))}
            {overflow > 0 && (
              <span className="rounded-full bg-[#EEECE7] px-2 py-1 text-nano font-bold text-[#7A7C94]">
                +{overflow}
              </span>
            )}
          </div>
        );
      },
    });
  }

  return rows;
}

// --- Column header (image + name + View Details link) ---

function CompareColumnHeader({ listing, onClose }: { listing: ExploreListing; onClose: () => void }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className="relative h-24 w-full overflow-hidden rounded-[1.35rem] md:h-28">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 40vw, 240px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#EFE7DE] text-sm font-semibold text-[#5E6588]">
            No Image
          </div>
        )}
      </div>
      <h3 className="mt-2.5 w-full truncate text-sm font-extrabold text-[#2A2826]">{listing.name}</h3>
      <Link
        href={listingHref(listing)}
        onClick={onClose}
        className="mt-1 text-nano font-extrabold uppercase tracking-[0.04em] text-[#B9401D] underline underline-offset-2 md:text-tiny"
      >
        View Details
      </Link>
    </div>
  );
}

// --- Shared comparison body (used by both the sheet and the desktop modal) ---

function ComparisonContent({
  listings,
  onClose,
}: {
  listings: [ExploreListing, ExploreListing];
  onClose: () => void;
}) {
  const [a, b] = listings;
  const rows = buildRows(a, b);

  return (
    <div className="px-5 pb-6 pt-5 md:px-8 md:pb-8">
      {/* Column headers with the VS badge between them */}
      <div className={`grid ${COMPARE_COLS} items-start gap-x-2 md:gap-x-4`}>
        <CompareColumnHeader listing={a} onClose={onClose} />
        <div className="flex justify-center pt-9 md:pt-11">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1C1C18] text-tiny font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_8px_20px_rgba(28,28,24,0.25)] md:h-10 md:w-10 md:text-xs">
            VS
          </span>
        </div>
        <CompareColumnHeader listing={b} onClose={onClose} />
      </div>

      {/* Attribute rows, staggered in */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}
      >
        {rows.map((row) => (
          <motion.div
            key={row.label}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
            }}
            className={`grid ${COMPARE_COLS} gap-x-2 border-t border-text-primary/8 py-3.5 md:gap-x-4 md:py-4`}
          >
            <div className="min-w-0">{row.render(a)}</div>
            <p className="text-center text-nano font-extrabold uppercase leading-tight tracking-[0.08em] text-[#9A9AAE] md:text-tiny">
              {row.label}
            </p>
            <div className="min-w-0">{row.render(b)}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// --- Main component ---

export function CompareModal({ isOpen, onClose, listings }: CompareModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const pair =
    listings.length >= 2
      ? ([listings[0], listings[1]] as [ExploreListing, ExploreListing])
      : null;

  const header = (
    <div className="flex shrink-0 items-center justify-between border-b border-text-primary/8 px-5 py-4 md:px-8">
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-text-primary/6"
        aria-label="Close compare"
      >
        <X className="h-4 w-4 text-text-primary" />
      </button>
      <h2 className="text-base font-bold text-text-primary">Compare</h2>
      <span className="h-8 w-8" aria-hidden="true" />
    </div>
  );

  const footer = (
    <div className="shrink-0 border-t border-text-primary/8 px-5 pb-[env(safe-area-inset-bottom,1rem)] pt-4 md:px-8 md:pb-4">
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-full bg-[#1C1C18] py-4 text-sm font-extrabold text-white transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Done
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && pair && (
        <>
          {/* Backdrop */}
          <motion.div
            key="compare-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Desktop: centered modal (scale + fade, FilterModal timing) */}
          <motion.div
            key="compare-desktop"
            role="dialog"
            aria-modal="true"
            aria-label="Compare listings"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center p-4 md:flex"
          >
            <div
              className="pointer-events-auto flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl bg-white shadow-[0_24px_64px_rgba(34,27,18,0.22)]"
              onClick={(event) => event.stopPropagation()}
            >
              {header}
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                <ComparisonContent listings={pair} onClose={onClose} />
              </div>
              {footer}
            </div>
          </motion.div>

          {/* Mobile: bottom sheet (slides up, MobileBookingDock spring) */}
          <motion.div
            key="compare-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Compare listings"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-4xl bg-white shadow-[0_-8px_40px_rgba(34,27,18,0.18)] md:hidden"
            style={{ maxHeight: "92dvh" }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex shrink-0 justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-text-primary/15" />
            </div>
            {header}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
              <ComparisonContent listings={pair} onClose={onClose} />
            </div>
            {footer}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
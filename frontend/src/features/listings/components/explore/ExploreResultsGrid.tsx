"use client";

import type { RefObject } from "react";
import { ArrowUp, CloudOff, Loader2, RotateCcw, SearchX } from "lucide-react";
import type { ExploreListing } from "../../explore.types";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { EXPLORE_PAGE_SIZE } from "../../hooks/useExploreListings";
import { DesktopExploreCard, MobileExploreCard } from "./ExploreListingCards";

type Variant = "mobile" | "tablet" | "desktop";

interface ExploreResultsGridProps {
  variant: Variant;
  noun: "venue" | "service";
  listings: ExploreListing[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  selectedIds: Set<string>;
  onToggleCompare: (id: string) => void;
  /** The desktop pane scrolls internally, so it must be the observer root. */
  scrollRootRef?: RefObject<HTMLElement | null>;
}

const GRID_CLASS: Record<Variant, string> = {
  mobile: "flex flex-col gap-12",
  tablet: "grid grid-cols-2 gap-8",
  desktop: "grid grid-cols-3 gap-8",
};

const INITIAL_SKELETONS: Record<Variant, number> = { mobile: 3, tablet: 4, desktop: 6 };
const NEXT_PAGE_SKELETONS: Record<Variant, number> = { mobile: 1, tablet: 2, desktop: 3 };

/** Skeleton shaped like the real card so loading never shifts the layout. */
function SkeletonCard({ mobile }: { mobile: boolean }) {
  return (
    <div
      className={
        mobile
          ? "overflow-hidden rounded-4xl bg-white shadow-[0_16px_30px_rgba(50,38,23,0.08)]"
          : "overflow-hidden rounded-4xl bg-white"
      }
      aria-hidden="true"
    >
      <div className={`${mobile ? "h-80" : "h-69"} animate-pulse bg-text-primary/8`} />
      <div className={`${mobile ? "px-6" : "px-5"} space-y-3 py-5`}>
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-text-primary/8" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-text-primary/8" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-6 w-1/3 animate-pulse rounded-full bg-text-primary/8" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-text-primary/8" />
        </div>
      </div>
    </div>
  );
}

function InitialErrorState({ plural, onRetry }: { plural: string; onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-[0_4px_20px_rgba(26,31,60,0.08)]">
        <CloudOff className="h-7 w-7 text-[#B9401D]" />
      </div>
      <p className="text-lg font-bold text-[#2A2826]">We couldn&apos;t load {plural}</p>
      <p className="mt-1 max-w-xs text-sm text-[#5E6588]">
        Something went wrong on our end. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#B9401D] px-7 py-3 text-sm font-extrabold text-white transition hover:brightness-95 active:scale-[0.98]"
      >
        <RotateCcw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function EmptyState({ plural }: { plural: string }) {
  return (
    <div className="col-span-full flex flex-col items-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-[0_4px_20px_rgba(26,31,60,0.08)]">
        <SearchX className="h-7 w-7 text-text-primary/30" />
      </div>
      <p className="text-lg font-bold text-[#2A2826]">No {plural} found</p>
      <p className="mt-1 max-w-xs text-sm text-[#5E6588]">
        Try adjusting your search or filters to discover more.
      </p>
    </div>
  );
}

/**
 * The full results surface for one breakpoint: initial skeletons, error / empty
 * states, the card grid, the infinite-scroll sentinel, next-page skeletons, a
 * mid-scroll retry, a manual "Load more" fallback, and the end-of-results cap.
 *
 * All three breakpoint instances share ONE infinite query, so whichever
 * sentinel is visible drives pagination - hidden (display:none) sentinels
 * report zero intersection and never fetch.
 */
export function ExploreResultsGrid({
  variant,
  noun,
  listings,
  isPending,
  isError,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  selectedIds,
  onToggleCompare,
  scrollRootRef,
}: ExploreResultsGridProps) {
  const mobile = variant === "mobile";
  const plural = noun === "venue" ? "venues" : "services";
  const Card = mobile ? MobileExploreCard : DesktopExploreCard;

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: !isPending && !isError,
    rootRef: scrollRootRef,
  });

  const scrollToTop = () => {
    const root = scrollRootRef?.current;
    if (root) root.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={mobile ? "px-5 pb-44" : undefined}>
      <div className={GRID_CLASS[variant]} aria-busy={isPending || isFetchingNextPage}>
        {isPending &&
          Array.from({ length: INITIAL_SKELETONS[variant] }).map((_, index) => (
            <SkeletonCard key={`skeleton-${index}`} mobile={mobile} />
          ))}

        {!isPending && isError && listings.length === 0 && (
          <InitialErrorState plural={plural} onRetry={onRetry} />
        )}

        {!isPending && !isError && listings.length === 0 && <EmptyState plural={plural} />}

        {listings.map((listing) => (
          <Card
            key={listing.id}
            listing={listing}
            selected={selectedIds.has(listing.id)}
            onToggleCompare={() => onToggleCompare(listing.id)}
          />
        ))}
      </div>

      {/* Sentinel: observed ~800px before it scrolls into view, so the next
          page is already in flight when the user reaches the fold. */}
      {hasNextPage && <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />}

      {/* Next-page loading: skeleton row + polite announcement. The live region
          stays mounted so the message is actually announced. */}
      <div role="status" aria-live="polite">
        {isFetchingNextPage && (
          <div className={mobile ? "mt-12" : "mt-8"}>
            <div className={GRID_CLASS[variant]}>
              {Array.from({ length: NEXT_PAGE_SKELETONS[variant] }).map((_, index) => (
                <SkeletonCard key={`next-skeleton-${index}`} mobile={mobile} />
              ))}
            </div>
            <p className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-[#5E6588]">
              <Loader2 className="h-4 w-4 animate-spin text-[#B9401D]" aria-hidden="true" />
              Finding more {plural}…
            </p>
          </div>
        )}
      </div>

      {/* Mid-scroll failure: keep loaded results, offer a targeted retry.
          fetchNextPage() re-attempts the failed cursor, not the whole list. */}
      {isError && listings.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-4xl border border-[#E8DDD2] bg-white px-6 py-8 text-center">
          <p className="text-sm font-extrabold text-[#252423]">Couldn&apos;t load more {plural}</p>
          <p className="text-tiny font-semibold text-[#5E6588]">
            Your place in the list is saved - pick up right where you left off.
          </p>
          <button
            type="button"
            onClick={fetchNextPage}
            className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#B9401D] px-6 py-2.5 text-xs font-extrabold text-white transition hover:brightness-95 active:scale-[0.98]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Manual fallback - also covers environments without IntersectionObserver */}
      {hasNextPage && !isFetchingNextPage && !isError && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={fetchNextPage}
            className="rounded-full border border-[#E0B7AA] bg-white px-8 py-3 text-sm font-extrabold text-[#B9401D] shadow-sm transition hover:bg-[#FFF6EC] active:scale-[0.98]"
          >
            Load more {plural}
          </button>
        </div>
      )}

      {/* End cap - only after the user has actually paginated at least once */}
      {!hasNextPage && !isError && !isPending && listings.length >= EXPLORE_PAGE_SIZE && (
        <div className="mt-14 flex flex-col items-center gap-3 border-t border-text-primary/8 pt-10 text-center">
          <span className="h-1 w-12 rounded-full bg-[#B9401D]/25" aria-hidden="true" />
          <p className="text-sm font-extrabold text-[#252423]">
            You&apos;ve seen all {listings.length} {plural}
          </p>
          <p className="text-tiny font-semibold text-[#5E6588]">
            Adjust your search or filters to discover more.
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-text-primary/15 bg-white px-6 py-2.5 text-xs font-extrabold text-text-primary shadow-sm transition hover:border-text-primary/35 active:scale-[0.98]"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Back to top
          </button>
        </div>
      )}
    </div>
  );
}
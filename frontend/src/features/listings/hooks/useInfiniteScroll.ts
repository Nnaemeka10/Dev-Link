import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

interface InfiniteScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  enabled?: boolean;
  /**
   * The scroll container, when results scroll inside an inner pane (the desktop
   * explore layout). Omit for window-scrolled layouts. Using the real container
   * as the observer root lets `rootMargin` prefetch work inside `overflow-y-auto`
   * panes, where viewport margins get clipped by the ancestor's overflow.
   */
  rootRef?: RefObject<HTMLElement | null>;
  /** Prefetch ~1 viewport ahead so the next page arrives before the fold. */
  rootMargin?: string;
}

/**
 * IntersectionObserver-driven infinite scroll.
 * Returns a callback ref for a 1px sentinel placed after the last card.
 *
 * - The observer is created in an effect, not the ref callback, so the parent
 *   scroll container's ref is guaranteed to be attached first and refs attach
 *   child-before-parent, which would otherwise hand the observer a null root.
 * - `isFetchingNextPage` is an effect dependency on purpose: when a fetch
 *   completes the observer is torn down and re-created, re-delivering the
 *   current intersection state. If the sentinel is STILL visible (short page,
 *   tall viewport) the next page fires automatically until the viewport is
 *   filled and no dead "load more" stall.
 * - React Query cancels concurrent fetchNextPage calls internally, and the
 *   fetching guard ref short-circuits before we even call it, so rapid
 *   intersection flaps can never double-fetch a cursor.
 * - If IntersectionObserver is unavailable the hook silently no-ops and the
 *   grid's always-rendered "Load more" button remains as the manual fallback.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
  rootRef,
  rootMargin = "800px 0px",
}: InfiniteScrollOptions) {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const sentinelRef = useCallback((node: HTMLElement | null) => setSentinel(node), []);

  const fetchingRef = useRef(isFetchingNextPage);
  fetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    if (!sentinel || !enabled || !hasNextPage) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !fetchingRef.current) {
          fetchNextPage();
        }
      },
      { root: rootRef?.current ?? null, rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, enabled, hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin, rootRef]);

  return sentinelRef;
}
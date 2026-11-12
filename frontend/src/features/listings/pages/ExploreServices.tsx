"use client";

import { useWatch } from "react-hook-form";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchForm } from "@/features/search/hooks/useSearchForm";
import { useSyncFormWithUrl } from "@/features/search/hooks/useSyncFormWithUrl";
import type { SearchFormData } from "@/features/search/utils/searchSchema";
import { buildListingsUrl, SERVICE_CATEGORIES, saveLastSearch } from "@/features/search";
import { useExploreListings } from "../hooks/useExploreListings";
import { DesktopCompareBar, MobileCompareBar } from "../components/explore/CompareBars";
import { ExploreResultsGrid } from "../components/explore/ExploreResultsGrid";
import { DesktopExploreHeader, DesktopResultsHeader } from "../components/explore/DesktopExploreHeader";
import MobileExploreHeader, { MobileResultsHeader } from "../components/explore/MobileExploreHeader";
import { toggleSelection } from "../utils/compareSelection";
import HomeFooter from "@/components/layout/Footer";
import SideNavBar from "@/components/layout/SideNavBar";
import MobileDock from "@/components/layout/MobileDock";

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const PANE_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40";

export default function ExploreServices() {
  const searchParams = useSearchParams();
  const coverage = searchParams.get("coverage") || undefined;
  const role = searchParams.get("role") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const flexible = searchParams.get("flexible") ? Number(searchParams.get("flexible")) : undefined;
  const sort = searchParams.get("sort") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;
  const priceMin = searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : undefined;
  const priceMax = searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined;
  const minRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined;
  const verified = searchParams.get("verified") === "true";

  // Cursor-paginated feed. Hall-only filters (amenities, venueTypes, capacity)
  // are intentionally not read here - the publish flow writes no
  // listing_features or capacity for services.
  const {
    listings,
    isPending,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useExploreListings({
    kind: "service",
    coverage,
    role,
    dateFrom,
    dateTo,
    flexible,
    sort,
    sortOrder,
    priceMin,
    priceMax,
    minRating,
    verified,
  });

  const [mobileSelectedIds, setMobileSelectedIds] = useState(() => new Set<string>());
  const [desktopSelectedIds, setDesktopSelectedIds] = useState(() => new Set<string>());
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const [isTransitioning, startTransition] = useTransition();
  const form = useSearchForm();
  useSyncFormWithUrl(form);

  const mobileSelectedListings = useMemo(
    () => listings.filter((listing) => mobileSelectedIds.has(listing.id)),
    [listings, mobileSelectedIds],
  );
  const desktopSelectedListings = useMemo(
    () => listings.filter((listing) => desktopSelectedIds.has(listing.id)),
    [listings, desktopSelectedIds],
  );

  const handleSearch = (data: SearchFormData) => {
    // Persist so the homepage hero + a fresh visit restore this exact search.
    saveLastSearch(data);
    startTransition(() => {
      router.push(buildListingsUrl(data));
    });
  };

  const selectedDateRange = useWatch({ control: form.control, name: "dateRange" });
  const selectedCoverage = useWatch({ control: form.control, name: "coverageArea" });
  const selectedFlexible = useWatch({ control: form.control, name: "flexible" });

  // From the URL, NOT the form: survives refresh by construction.
  const roleLabel = SERVICE_CATEGORIES.find((c) => c.id === searchParams.get("role"))?.label;

  const mobileDateLabel = (() => {
    if (!selectedDateRange?.from) return "";
    const base = !selectedDateRange.to
      ? formatDateLabel(selectedDateRange.from)
      : `${formatDateLabel(selectedDateRange.from)} - ${formatDateLabel(selectedDateRange.to)}`;
    return selectedFlexible ? `${base} ±${selectedFlexible}d` : base;
  })();

  const mobileSummaryLines = (() => {
    const lines: { label: string; value: string }[] = [];
    if (selectedCoverage?.trim()) lines.push({ label: "Where", value: selectedCoverage.trim() });
    if (roleLabel) lines.push({ label: "Who", value: roleLabel });
    if (mobileDateLabel) lines.push({ label: "When", value: mobileDateLabel });
    return lines;
  })();

  const resultsCount = listings.length;
  const locationLabel = coverage || "Nigeria";

  const resultsProps = {
    noun: "service" as const,
    listings,
    isPending,
    isError,
    onRetry: () => {
      void refetch();
    },
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => {
      void fetchNextPage();
    },
  };

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <section className="md:hidden">
        <MobileExploreHeader
          handleSearch={handleSearch}
          form={form}
          isPending={isTransitioning}
          mobileSummary={mobileSummaryLines}
          category="services"
        />
        <MobileResultsHeader
          count={resultsCount}
          hasMore={hasNextPage}
          locationLabel={locationLabel}
          listingType="service"
          roleLabel={roleLabel}
        />
        <ExploreResultsGrid
          variant="mobile"
          {...resultsProps}
          selectedIds={mobileSelectedIds}
          onToggleCompare={(id) => setMobileSelectedIds((current) => toggleSelection(current, id))}
        />
        <MobileCompareBar
          selectedListings={mobileSelectedListings}
          onClear={() => setMobileSelectedIds(new Set())}
        />
        <MobileDock />
        <HomeFooter />
      </section>

      <section className="hidden md:block xl:hidden">
        <DesktopExploreHeader
          handleSearch={handleSearch}
          form={form}
          isPending={isTransitioning}
          category="services"
        />
        <div className="px-8 pb-12 pt-10">
          <DesktopResultsHeader
            count={resultsCount}
            hasMore={hasNextPage}
            locationLabel={locationLabel}
            listingType="service"
            roleLabel={roleLabel}
          />
          <ExploreResultsGrid
            variant="tablet"
            {...resultsProps}
            selectedIds={desktopSelectedIds}
            onToggleCompare={(id) => setDesktopSelectedIds((current) => toggleSelection(current, id))}
          />
        </div>
        <DesktopCompareBar
          selectedListings={desktopSelectedListings}
          onClear={() => setDesktopSelectedIds(new Set())}
        />
        <MobileDock />
        <HomeFooter />
      </section>

\
      <section className="hidden h-screen xl:flex">
        <SideNavBar />
        <div className="ml-[15%] flex w-[85%] flex-col overflow-hidden">
          <DesktopExploreHeader
            handleSearch={handleSearch}
            form={form}
            isPending={isTransitioning}
            category="services"
          />
          <div className="flex flex-1 overflow-hidden">
            <div ref={desktopScrollRef} className={`flex-1 overflow-y-auto ${PANE_SCROLLBAR}`}>
              <div className="px-8 pb-12 pt-10">
                <DesktopResultsHeader
                  count={resultsCount}
                  hasMore={hasNextPage}
                  locationLabel={locationLabel}
                  listingType="service"
                  roleLabel={roleLabel}
                />
                <ExploreResultsGrid
                  variant="desktop"
                  {...resultsProps}
                  selectedIds={desktopSelectedIds}
                  onToggleCompare={(id) => setDesktopSelectedIds((current) => toggleSelection(current, id))}
                  scrollRootRef={desktopScrollRef}
                />
              </div>
              <HomeFooter />
            </div>
            <DesktopCompareBar
              selectedListings={desktopSelectedListings}
              onClear={() => setDesktopSelectedIds(new Set())}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
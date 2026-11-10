"use client";

import { useWatch } from "react-hook-form";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchForm } from "@/features/search/hooks/useSearchForm";
import { buildListingsHref } from "@/features/listings/searchParams";
import type { SearchFormData } from "@/features/search/utils/searchSchema";

// --- REAL DATA IMPORTS ---
import { useExploreListings } from "../hooks/useExploreListings";
import { DesktopCompareBar, MobileCompareBar } from "../components/explore/CompareBars";
import { DesktopExploreCard, MobileExploreCard } from "../components/explore/ExploreListingCards";
import { DesktopExploreHeader, DesktopResultsHeader } from "../components/explore/DesktopExploreHeader";
import { SERVICE_CATEGORIES } from "@/features/search";

import MobileExploreHeader, { MobileResultsHeader } from "../components/explore/MobileExploreHeader";
import { toggleSelection } from "../utils/compareSelection";
import HomeFooter from "@/components/layout/Footer";
import SideNavBar from "@/components/layout/SideNavBar";
import MobileDock from "@/components/layout/MobileDock";

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function ExploreServices() {
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const sort = searchParams.get("sort") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;
  const priceMin = searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : undefined;
  const priceMax = searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined;
  const capacityMin = searchParams.get("capacityMin") ? Number(searchParams.get("capacityMin")) : undefined;
  const capacityMax = searchParams.get("capacityMax") ? Number(searchParams.get("capacityMax")) : undefined;
  const minRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined;
  const verified = searchParams.get("verified") === "true";
  const venueTypes = searchParams.get("venueTypes")?.split(",").filter(Boolean);
  const amenities = searchParams.get("amenities")?.split(",").filter(Boolean);
  const coverage = searchParams.get("coverage") || undefined;
  const role = searchParams.get("role") || undefined;
  const flexible = searchParams.get("flexible") ? Number(searchParams.get("flexible")) : undefined;

  // --- REAL DATA HOOK ---
  const { data, isPending, isError } = useExploreListings({
        kind: "service",
        coverage,
        role,
        flexible,
        dateFrom,
        dateTo,
        sort,
        sortOrder,
        priceMin,
        priceMax,
        capacityMin,
        capacityMax,
        minRating,
        verified,
        venueTypes,
        amenities
    });

  const listings = useMemo(() => data?.data ?? [], [data]);
  
  const [mobileSelectedIds, setMobileSelectedIds] = useState(() => new Set<string>());
  const [desktopSelectedIds, setDesktopSelectedIds] = useState(() => new Set<string>());
  const router = useRouter();
  const [isTransitioning, startTransition] = useTransition();
  const form = useSearchForm();

  const mobileSelectedListings = useMemo(
    () => listings.filter((listing) => mobileSelectedIds.has(listing.id)),
    [listings, mobileSelectedIds]
  );
  const desktopSelectedListings = useMemo(
    () => listings.filter((listing) => desktopSelectedIds.has(listing.id)),
    [listings, desktopSelectedIds]
  );

  const handleSearch = (data: SearchFormData) => {
    startTransition(() => {
      router.push(buildListingsHref({
        category: "services",
        coverage: data.coverageArea || undefined,
        role: data.role || undefined,
        dateFrom: data.dateRange?.from?.toISOString(),
        dateTo: data.dateRange?.to?.toISOString(),
        flexible: data.flexible || undefined,
      }));
    });
  };

  const selectedDateRange = useWatch({ control: form.control, name: "dateRange" });
  const selectedCoverage = useWatch({ control: form.control, name: "coverageArea" });
  const selectedRole = useWatch({ control: form.control, name: "role" });
  const selectedFlexible = useWatch({ control: form.control, name: "flexible" });

  const roleLabel = SERVICE_CATEGORIES.find((c) => c.id === selectedRole)?.label;

  const mobileDateLabel = (() => {
    if (!selectedDateRange?.from) return "";
    const base = !selectedDateRange.to
      ? formatDateLabel(selectedDateRange.from)
      : `${formatDateLabel(selectedDateRange.from)} - ${formatDateLabel(selectedDateRange.to)}`;
    return selectedFlexible ? `${base} ±${selectedFlexible}d` : base;
  })();

  const mobileSummaryLines = (() => {
    const lines: {label: string; value: string}[] = [];
    if (selectedCoverage?.trim()) lines.push({label: "Where", value: selectedCoverage.trim()});
    if (roleLabel) lines.push({label: "Who", value: roleLabel});
    if (mobileDateLabel) lines.push({label: "When", value: mobileDateLabel});
    return lines;
  })();

  const resultsCount = listings.length;
  const locationLabel = coverage || "Nigeria";

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <section className="md:hidden">
        <MobileExploreHeader handleSearch={handleSearch} form={form} isPending={isTransitioning} mobileSummary={mobileSummaryLines} category="services"/>
        <MobileResultsHeader count={resultsCount} locationLabel= {locationLabel} listingType="service"/>
        <div className="flex flex-col gap-12 px-5 pb-44">
          {isPending && (
              <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-96 animate-pulse rounded-4xl bg-text-primary/8" />
                  ))}
              </div>
            )}
            {isError && (
              <p className="text-center text-sm font-medium text-[#5E6588]">Failed to load services.</p>
            )}
            {!isPending && !isError && listings.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                  <p className="text-lg font-bold text-[#2A2826]">No Services found</p>
                  <p className="mt-1 text-sm text-[#5E6588]">Try adjusting your search filters.</p>
              </div>
            )}
          {listings.map((listing) => (
            <MobileExploreCard key={listing.id} listing={listing} selected={mobileSelectedIds.has(listing.id)} onToggleCompare={() => setMobileSelectedIds((current) => toggleSelection(current, listing.id))} />
          ))}
        </div>
        <MobileCompareBar selectedListings={mobileSelectedListings} onClear={() => setMobileSelectedIds(new Set())} />
        <MobileDock />
        <HomeFooter />
      </section>

      <section className="hidden md:block xl:hidden">
        <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isTransitioning} category="services"/>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 pb-12 pt-10">
            <DesktopResultsHeader count={resultsCount} locationLabel={locationLabel} listingType="service"/>
            <div className="grid grid-cols-2 gap-8">
              {isPending && (

                <>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-96 animate-pulse rounded-4xl bg-text-primary/8" />
                    ))}
                </div>

                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-96 animate-pulse rounded-4xl bg-text-primary/8" />
                    ))}
                </div>
                </>
              )}
              {isError && (
                <p className="text-center text-sm font-medium text-[#5E6588]">Failed to load services.</p>
              )}
              {!isPending && !isError && listings.length === 0 && (
                <div className="flex flex-col items-center py-20 text-center">
                    <p className="text-lg font-bold text-[#2A2826]">No services found</p>
                    <p className="mt-1 text-sm text-[#5E6588]">Try adjusting your search filters.</p>
                </div>
              )}
              {listings.map((listing) => (
                <DesktopExploreCard key={listing.id} listing={listing} selected={desktopSelectedIds.has(listing.id)} onToggleCompare={() => setDesktopSelectedIds((current) => toggleSelection(current, listing.id))} />
              ))}
            </div>
          </div>
          <DesktopCompareBar selectedListings={desktopSelectedListings} onClear={() => setDesktopSelectedIds(new Set())} />
        </div>
        <MobileDock />
        <HomeFooter />
      </section>

      <section className="hidden xl:flex h-screen">
        <SideNavBar />
        <div className="ml-[15%] w-[85%] flex flex-col overflow-hidden">
          <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isTransitioning} category="services"/>
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="px-8 pb-12 pt-10">
                <DesktopResultsHeader count={resultsCount} locationLabel={locationLabel} listingType="service"/>
                <div className="grid grid-cols-3 gap-8">

                  {isPending && (
                    <>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-96 animate-pulse rounded-4xl bg-text-primary/8" />
                        ))}
                    </div>

                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-96 animate-pulse rounded-4xl bg-text-primary/8" />
                        ))}
                    </div>

                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-96 animate-pulse rounded-4xl bg-text-primary/8" />
                        ))}
                    </div>
                    </>
                  )}
                  {isError && (
                    <p className="text-center text-sm font-medium text-[#5E6588]">Failed to load services.</p>
                  )}
                  {!isPending && !isError && listings.length === 0 && (
                    <div className="flex flex-col items-center py-20 text-center">
                        <p className="text-lg font-bold text-[#2A2826]">No services found</p>
                        <p className="mt-1 text-sm text-[#5E6588]">Try adjusting your search filters.</p>
                    </div>
                  )}

                  {listings.map((listing) => (
                    <DesktopExploreCard key={listing.id} listing={listing} selected={desktopSelectedIds.has(listing.id)} onToggleCompare={() => setDesktopSelectedIds((current) => toggleSelection(current, listing.id))} />
                  ))}
                </div>
              </div>
              <HomeFooter />
            </div>
            <DesktopCompareBar selectedListings={desktopSelectedListings} onClear={() => setDesktopSelectedIds(new Set())} />
          </div>
        </div>
      </section>
    </main>
  );
}
"use client";

import { Map } from "lucide-react";
import { useWatch } from "react-hook-form";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchForm } from "@/features/search/hooks/useSearchForm";
import { buildListingsHref, normalizeListingSearchParams } from "@/features/listings/searchParams";
import type { SearchFormData } from "@/features/search/utils/searchSchema";//

import SideNavBar from "../components/SideNavBar";
import {
  DESKTOP_EXPLORE_LISTINGS,
  INITIAL_DESKTOP_COMPARE_IDS,
  INITIAL_MOBILE_COMPARE_IDS,
  MOBILE_EXPLORE_LISTINGS,
} from "../explore.data";
import { DesktopCompareBar, MobileCompareBar } from "../components/explore/CompareBars";
import { DesktopExploreCard, MobileExploreCard } from "../components/explore/ExploreListingCards";
import { DesktopExploreHeader, DesktopResultsHeader } from "../components/explore/DesktopExploreHeader";
import ExploreFooter from "../components/explore/ExploreFooter";
import MobileBottomNav from "../components/explore/MobileBottomNav";
import MobileExploreHeader, { MobileResultsHeader } from "../components/explore/MobileExploreHeader";
import StaticMapPanel from "../components/explore/StaticMapPanel";
import { toggleSelection } from "../utils/compareSelection";

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}


export default function ExploreMarketplace() {
  const [mobileSelectedIds, setMobileSelectedIds] = useState(() => new Set(INITIAL_MOBILE_COMPARE_IDS));
  const [desktopSelectedIds, setDesktopSelectedIds] = useState(() => new Set(INITIAL_DESKTOP_COMPARE_IDS));
  const router = useRouter();//
  const [isPending, startTransition] = useTransition(); //

  const form = useSearchForm(); //


  const mobileSelectedListings = useMemo(
    () => MOBILE_EXPLORE_LISTINGS.filter((listing) => mobileSelectedIds.has(listing.id)),
    [mobileSelectedIds]
  );
  const desktopSelectedListings = useMemo(
    () => DESKTOP_EXPLORE_LISTINGS.filter((listing) => desktopSelectedIds.has(listing.id)),
    [desktopSelectedIds]
  );

  
  
  const handleSearch = (data: SearchFormData) => {
      startTransition(() => {
        router.push(
          buildListingsHref({
            category: data.category,
            location: data.location || undefined,
            dateFrom: data.dateRange?.from?.toISOString(),
            dateTo: data.dateRange?.to?.toISOString(),
            capacity: data.capacity,
            role: data.role,
          })
        );
      });
    };


  
   // Watch form values for mobile summary display
    const selectedCategory = useWatch({
      control: form.control,
      name: "category",
    });
    const selectedDateRange = useWatch({
      control: form.control,
      name: "dateRange",
    });
    const selectedLocation = useWatch({
      control: form.control,
      name: "location",
    });
    const selectedCapacity = useWatch({
      control: form.control,
      name: "capacity",
    });
    const selectedRole = useWatch({
      control: form.control,
      name: "role",
    });



    // Compute mobile summary labels
    const mobileDateLabel = (() => {
      if (!selectedDateRange?.from) return "";
      if (!selectedDateRange.to) return formatDateLabel(selectedDateRange.from);
      return `${formatDateLabel(selectedDateRange.from)} - ${formatDateLabel(selectedDateRange.to)}`;
    })();

    // Build mobile summary based on category
    const mobileSummaryLines = (() => {
      const lines: string[] = [];
      
      if (selectedCategory === "halls") {
        if (selectedLocation?.trim()) lines.push(selectedLocation.trim());
        if (selectedCapacity) lines.push(`${selectedCapacity} guests`);
        if (mobileDateLabel) lines.push(mobileDateLabel);
      } else if (selectedCategory === "services") {
        if (selectedRole) lines.push(selectedRole);
        if (mobileDateLabel) lines.push(mobileDateLabel);
      }
      
      return lines;
    })();


  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <section className="md:hidden">
        <MobileExploreHeader
          handleSearch={handleSearch}
          form={form}
          isPending={isPending}
          mobileSummary={mobileSummaryLines}
        />

        <MobileResultsHeader />

        <div className="flex flex-col gap-12 px-5 pb-44">
          {MOBILE_EXPLORE_LISTINGS.map((listing) => (
            <MobileExploreCard
              key={listing.id}
              listing={listing}
              selected={mobileSelectedIds.has(listing.id)}
              onToggleCompare={() => setMobileSelectedIds((current) => toggleSelection(current, listing.id))}
            />
          ))}
        </div>

        {/* <button
          type="button"
          className="fixed bottom-[5.8rem] left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1D1D1A] px-7 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
        >
          <Map className="h-4 w-4" />
          Show Map
        </button> */}

        <MobileCompareBar selectedListings={mobileSelectedListings} onClear={() => setMobileSelectedIds(new Set())} />
        <MobileBottomNav />
        <ExploreFooter />
      </section>







      <section className="hidden md:block xl:hidden">
        <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isPending}  />
        <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 pb-12 pt-10">
              <DesktopResultsHeader />

              <div className="grid grid-cols-2 gap-8">
                {DESKTOP_EXPLORE_LISTINGS.map((listing) => (
                  <DesktopExploreCard
                    key={listing.id}
                    listing={listing}
                    selected={desktopSelectedIds.has(listing.id)}
                    onToggleCompare={() => setDesktopSelectedIds((current) => toggleSelection(current, listing.id))}
                  />
                ))}
              </div>
            </div>

            <DesktopCompareBar selectedListings={desktopSelectedListings} onClear={() => setDesktopSelectedIds(new Set())} />
          </div>

        <MobileBottomNav />
        <ExploreFooter />
      </section>







      <section className="hidden xl:flex h-screen">
        <SideNavBar />
        <div className="ml-[15%] w-[85%] flex flex-col overflow-hidden">
          <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isPending}  />

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 pb-12 pt-10">
              <DesktopResultsHeader />

              <div className="grid grid-cols-2 gap-8">
                {DESKTOP_EXPLORE_LISTINGS.map((listing) => (
                  <DesktopExploreCard
                    key={listing.id}
                    listing={listing}
                    selected={desktopSelectedIds.has(listing.id)}
                    onToggleCompare={() => setDesktopSelectedIds((current) => toggleSelection(current, listing.id))}
                  />
                ))}
              </div>

              
            </div>

            <DesktopCompareBar selectedListings={desktopSelectedListings} onClear={() => setDesktopSelectedIds(new Set())} />
          </div>
          <ExploreFooter />
        </div>
      </section>
    </main>
  );
}

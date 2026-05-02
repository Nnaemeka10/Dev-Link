"use client";

import { Map } from "lucide-react";
import { useMemo, useState } from "react";

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
import MobileExploreHeader from "../components/explore/MobileExploreHeader";
import StaticMapPanel from "../components/explore/StaticMapPanel";
import { toggleSelection } from "../utils/compareSelection";

export default function ExploreMarketplace() {
  const [mobileSelectedIds, setMobileSelectedIds] = useState(() => new Set(INITIAL_MOBILE_COMPARE_IDS));
  const [desktopSelectedIds, setDesktopSelectedIds] = useState(() => new Set(INITIAL_DESKTOP_COMPARE_IDS));

  const mobileSelectedListings = useMemo(
    () => MOBILE_EXPLORE_LISTINGS.filter((listing) => mobileSelectedIds.has(listing.id)),
    [mobileSelectedIds]
  );
  const desktopSelectedListings = useMemo(
    () => DESKTOP_EXPLORE_LISTINGS.filter((listing) => desktopSelectedIds.has(listing.id)),
    [desktopSelectedIds]
  );

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <section className="lg:hidden">
        <MobileExploreHeader />

        <div className="space-y-8 px-5 pb-44">
          {MOBILE_EXPLORE_LISTINGS.map((listing) => (
            <MobileExploreCard
              key={listing.id}
              listing={listing}
              selected={mobileSelectedIds.has(listing.id)}
              onToggleCompare={() => setMobileSelectedIds((current) => toggleSelection(current, listing.id))}
            />
          ))}
        </div>

        <button
          type="button"
          className="fixed bottom-[5.8rem] left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1D1D1A] px-7 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
        >
          <Map className="h-4 w-4" />
          Show Map
        </button>

        <MobileCompareBar selectedListings={mobileSelectedListings} onClear={() => setMobileSelectedIds(new Set())} />
        <MobileBottomNav />
      </section>

      <section className="hidden min-h-screen lg:block">
        <DesktopExploreHeader />

        <div className="grid min-h-[calc(100vh-11.25rem)] grid-cols-[minmax(0,1fr)_34%] xl:grid-cols-[minmax(0,1fr)_35%]">
          <div className="px-8 pb-48 pt-10">
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

            <ExploreFooter />
          </div>

          <StaticMapPanel />
        </div>

        <DesktopCompareBar selectedListings={desktopSelectedListings} onClear={() => setDesktopSelectedIds(new Set())} />
      </section>
    </main>
  );
}

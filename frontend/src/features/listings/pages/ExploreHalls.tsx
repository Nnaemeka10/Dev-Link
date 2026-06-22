// "use client";

// import { useWatch } from "react-hook-form";
// import { useMemo, useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { useSearchForm } from "@/features/search/hooks/useSearchForm";
// import { buildListingsHref } from "@/features/listings/searchParams";
// import type { SearchFormData } from "@/features/search/utils/searchSchema";

// import {
//   DESKTOP_EXPLORE_LISTINGS,
//   INITIAL_DESKTOP_COMPARE_IDS,
//   INITIAL_MOBILE_COMPARE_IDS,
//   MOBILE_EXPLORE_LISTINGS,
// } from "../explore.data";
// import { DesktopCompareBar, MobileCompareBar } from "../components/explore/CompareBars";
// import { DesktopExploreCard, MobileExploreCard } from "../components/explore/ExploreListingCards";
// import { DesktopExploreHeader, DesktopResultsHeader } from "../components/explore/DesktopExploreHeader";

// import MobileBottomNav from "../components/explore/MobileBottomNav";
// import MobileExploreHeader, { MobileResultsHeader } from "../components/explore/MobileExploreHeader";
// import { toggleSelection } from "../utils/compareSelection";
// import HomeFooter from "@/components/layout/Footer";
// import SideNavBar from "@/components/layout/SideNavBar";

// function formatDateLabel(date: Date) {
//   return date.toLocaleDateString("en-NG", {
//     day: "numeric",
//     month: "short",
//   });
// }

// const MOBILE_HALLS = MOBILE_EXPLORE_LISTINGS.filter((l) => l.kind === "venue");
// const DESKTOP_HALLS = DESKTOP_EXPLORE_LISTINGS.filter((l) => l.kind === "venue");

// export default function ExploreHalls() {
//   const [mobileSelectedIds, setMobileSelectedIds] = useState(() => new Set(INITIAL_MOBILE_COMPARE_IDS));
//   const [desktopSelectedIds, setDesktopSelectedIds] = useState(() => new Set(INITIAL_DESKTOP_COMPARE_IDS));
//   const router = useRouter();
//   const [isPending, startTransition] = useTransition();

//   const form = useSearchForm();

//   const mobileSelectedListings = useMemo(
//     () => MOBILE_HALLS.filter((listing) => mobileSelectedIds.has(listing.id)),
//     [mobileSelectedIds]
//   );
//   const desktopSelectedListings = useMemo(
//     () => DESKTOP_HALLS.filter((listing) => desktopSelectedIds.has(listing.id)),
//     [desktopSelectedIds]
//   );

//   const handleSearch = (data: SearchFormData) => {
//     startTransition(() => {
//       router.push(
//         buildListingsHref({
//           category: data.category,
//           location: data.location || undefined,
//           dateFrom: data.dateRange?.from?.toISOString(),
//           dateTo: data.dateRange?.to?.toISOString(),
//           capacity: data.capacity,
//           role: data.role,
//         })
//       );
//     });
//   };

//   const selectedDateRange = useWatch({ control: form.control, name: "dateRange" });
//   const selectedLocation = useWatch({ control: form.control, name: "location" });
//   const selectedCapacity = useWatch({ control: form.control, name: "capacity" });

//   const mobileDateLabel = (() => {
//     if (!selectedDateRange?.from) return "";
//     if (!selectedDateRange.to) return formatDateLabel(selectedDateRange.from);
//     return `${formatDateLabel(selectedDateRange.from)} - ${formatDateLabel(selectedDateRange.to)}`;
//   })();

//   const mobileSummaryLines = (() => {
//     const lines: string[] = [];
//     if (selectedLocation?.trim()) lines.push(selectedLocation.trim());
//     if (selectedCapacity) lines.push(`${selectedCapacity} guests`);
//     if (mobileDateLabel) lines.push(mobileDateLabel);
//     return lines;
//   })();

//   return (
//     <main className="min-h-screen bg-bg-primary text-[#252423]">
//       <section className="md:hidden">
//         <MobileExploreHeader
//           handleSearch={handleSearch}
//           form={form}
//           isPending={isPending}
//           mobileSummary={mobileSummaryLines}
//         />

//         <MobileResultsHeader />

//         <div className="flex flex-col gap-12 px-5 pb-44">
//           {MOBILE_HALLS.map((listing) => (
//             <MobileExploreCard
//               key={listing.id}
//               listing={listing}
//               selected={mobileSelectedIds.has(listing.id)}
//               onToggleCompare={() => setMobileSelectedIds((current) => toggleSelection(current, listing.id))}
//             />
//           ))}
//         </div>

//         <MobileCompareBar selectedListings={mobileSelectedListings} onClear={() => setMobileSelectedIds(new Set())} />
//         <MobileBottomNav />
//         <HomeFooter />
//       </section>

//       <section className="hidden md:block xl:hidden">
//         <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isPending} />
//         <div className="flex flex-1 overflow-hidden">
//           <div className="flex-1 overflow-y-auto px-8 pb-12 pt-10">
//             <DesktopResultsHeader />

//             <div className="grid grid-cols-2 gap-8">
//               {DESKTOP_HALLS.map((listing) => (
//                 <DesktopExploreCard
//                   key={listing.id}
//                   listing={listing}
//                   selected={desktopSelectedIds.has(listing.id)}
//                   onToggleCompare={() => setDesktopSelectedIds((current) => toggleSelection(current, listing.id))}
//                 />
//               ))}
//             </div>
//           </div>
//           <DesktopCompareBar selectedListings={desktopSelectedListings} onClear={() => setDesktopSelectedIds(new Set())} />
//         </div>
//         <MobileBottomNav />
//         <HomeFooter />
//       </section>

//       <section className="hidden xl:flex h-screen">
//         <SideNavBar />
//         <div className="ml-[15%] w-[85%] flex flex-col overflow-hidden">
//           <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isPending} />

//           <div className="flex flex-1 overflow-hidden">
//             <div className="flex-1 overflow-y-auto">
//               <div className="px-8 pb-12 pt-10">
//                 <DesktopResultsHeader />

//                 <div className="grid grid-cols-2 gap-8">
//                   {DESKTOP_HALLS.map((listing) => (
//                     <DesktopExploreCard
//                       key={listing.id}
//                       listing={listing}
//                       selected={desktopSelectedIds.has(listing.id)}
//                       onToggleCompare={() => setDesktopSelectedIds((current) => toggleSelection(current, listing.id))}
//                     />
//                   ))}
//                 </div>
//               </div>
//               <HomeFooter />
//             </div>

//             <DesktopCompareBar selectedListings={desktopSelectedListings} onClear={() => setDesktopSelectedIds(new Set())} />
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }
"use client";

import { useWatch } from "react-hook-form";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSearchForm } from "@/features/search/hooks/useSearchForm";
import { buildListingsHref } from "@/features/listings/searchParams";
import type { SearchFormData } from "@/features/search/utils/searchSchema";

// --- REAL DATA IMPORTS ---
import { useExploreListings } from "../hooks/useExploreListings";
import { DesktopCompareBar, MobileCompareBar } from "../components/explore/CompareBars";
import { DesktopExploreCard, MobileExploreCard } from "../components/explore/ExploreListingCards";
import { DesktopExploreHeader, DesktopResultsHeader } from "../components/explore/DesktopExploreHeader";
import MobileBottomNav from "../components/explore/MobileBottomNav";
import MobileExploreHeader, { MobileResultsHeader } from "../components/explore/MobileExploreHeader";
import { toggleSelection } from "../utils/compareSelection";
import HomeFooter from "@/components/layout/Footer";
import SideNavBar from "@/components/layout/SideNavBar";

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function ExploreHalls() {
  // --- REAL DATA HOOK ---
  const { data: listings = [], isPending, isError } = useExploreListings("hall");
  
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
      router.push(buildListingsHref({ category: data.category, location: data.location || undefined, dateFrom: data.dateRange?.from?.toISOString(), dateTo: data.dateRange?.to?.toISOString(), capacity: data.capacity, role: data.role }));
    });
  };

  const selectedDateRange = useWatch({ control: form.control, name: "dateRange" });
  const selectedLocation = useWatch({ control: form.control, name: "location" });
  const selectedCapacity = useWatch({ control: form.control, name: "capacity" });

  const mobileDateLabel = (() => {
    if (!selectedDateRange?.from) return "";
    if (!selectedDateRange.to) return formatDateLabel(selectedDateRange.from);
    return `${formatDateLabel(selectedDateRange.from)} - ${formatDateLabel(selectedDateRange.to)}`;
  })();

  const mobileSummaryLines = (() => {
    const lines: string[] = [];
    if (selectedLocation?.trim()) lines.push(selectedLocation.trim());
    if (selectedCapacity) lines.push(`${selectedCapacity} guests`);
    if (mobileDateLabel) lines.push(mobileDateLabel);
    return lines;
  })();

  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <section className="md:hidden">
        <MobileExploreHeader handleSearch={handleSearch} form={form} isPending={isTransitioning} mobileSummary={mobileSummaryLines} />
        <MobileResultsHeader />
        <div className="flex flex-col gap-12 px-5 pb-44">
          {isPending && <p>Loading halls...</p>}
          {isError && <p>Failed to load halls.</p>}
          {listings.map((listing) => (
            <MobileExploreCard key={listing.id} listing={listing} selected={mobileSelectedIds.has(listing.id)} onToggleCompare={() => setMobileSelectedIds((current) => toggleSelection(current, listing.id))} />
          ))}
        </div>
        <MobileCompareBar selectedListings={mobileSelectedListings} onClear={() => setMobileSelectedIds(new Set())} />
        <MobileBottomNav />
        <HomeFooter />
      </section>

      <section className="hidden md:block xl:hidden">
        <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isTransitioning} />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 pb-12 pt-10">
            <DesktopResultsHeader />
            <div className="grid grid-cols-2 gap-8">
              {isPending && <p>Loading halls...</p>}
              {isError && <p>Failed to load halls.</p>}
              {listings.map((listing) => (
                <DesktopExploreCard key={listing.id} listing={listing} selected={desktopSelectedIds.has(listing.id)} onToggleCompare={() => setDesktopSelectedIds((current) => toggleSelection(current, listing.id))} />
              ))}
            </div>
          </div>
          <DesktopCompareBar selectedListings={desktopSelectedListings} onClear={() => setDesktopSelectedIds(new Set())} />
        </div>
        <MobileBottomNav />
        <HomeFooter />
      </section>

      <section className="hidden xl:flex h-screen">
        <SideNavBar />
        <div className="ml-[15%] w-[85%] flex flex-col overflow-hidden">
          <DesktopExploreHeader handleSearch={handleSearch} form={form} isPending={isTransitioning} />
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="px-8 pb-12 pt-10">
                <DesktopResultsHeader />
                <div className="grid grid-cols-2 gap-8">
                  {isPending && <p>Loading halls...</p>}
                  {isError && <p>Failed to load halls.</p>}
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
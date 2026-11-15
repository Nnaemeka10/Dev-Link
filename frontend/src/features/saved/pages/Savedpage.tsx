"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, CalendarDays } from "lucide-react";
import SideNavBar from "@/components/layout/SideNavBar";
import MobileDock from "@/components/layout/MobileDock";
import SavedListingsPanel from "../components/SavedListingsPanel";
import BookingsPanel from "../components/BookingPanel";
import type { TopTab } from "../saved.types";

const TABS: { key: TopTab; label: string; icon: React.ElementType }[] = [
  { key: "saved", label: "Saved", icon: Bookmark },
  { key: "bookings", label: "Bookings", icon: CalendarDays },
];

function SavedPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TopTab) === "bookings" ? "bookings" : "saved";
  const [tab, setTab] = useState<TopTab>(initialTab);

  useEffect(() => {
    const t = (searchParams.get("tab") as TopTab) === "bookings" ? "bookings" : "saved";
    setTab(t);
  }, [searchParams]);

  function switchTab(next: TopTab) {
    setTab(next);
    router.replace(next === "bookings" ? `${pathname}?tab=bookings` : pathname, { scroll: false });
  }

  return (
    <main className="min-h-screen bg-bg-primary">
      <SideNavBar />
      <div className="xl:pl-64">
        <div className="mx-auto max-w-6xl px-5 pb-28 pt-8 sm:px-8 xl:pb-16 xl:pt-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#B9401D]">Your collection</p>
            <h1 className="mt-1 font-man text-3xl font-extrabold tracking-tight text-[#252423] md:text-4xl">Saved & Bookings</h1>
            <p className="mt-2 text-sm font-semibold text-[#9A9AAE]">Everything you've loved and booked, in one place.</p>
          </motion.div>

          {/* Top-level tabs */}
          <div className="mt-8 flex gap-1 border-b border-[#E8DDD2]">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchTab(key)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-extrabold transition-colors ${
                  tab === key ? "text-[#B9401D]" : "text-[#9A9AAE] hover:text-[#252423]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {tab === key && (
                  <motion.span
                    layoutId="saved-top-underline"
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#B9401D]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Panels */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {tab === "saved" ? <SavedListingsPanel /> : <BookingsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <MobileDock />
    </main>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <SavedPageInner />
    </Suspense>
  );
}
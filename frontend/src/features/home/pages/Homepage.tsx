"use client";

import { Sparkles } from "lucide-react";
import CategoryStrip from "../components/CategoryStrip";
import CuratedServicesSection from "../components/CuratedServicesSection";
import HeroSection from "../components/HeroSection";
import HomeFooter from "../components/HomeFooter";
import MobileDock from "../../../components/layout/MobileDock";
import PopularHallsSection from "../components/PopularHallsSection";
import TrendingSection from "../components/TrendingSection";
import TrustSignalsBar from "../components/TrustSignalsBar";

const HOME_PAGE_RESPONSE = {
  status: "success",
  message: "Homepage payload fetched successfully",
};


export default function Homepage() {
  return (
    <>
      <main
        className="bg-bg-primary motion-safe:animate-fade-in"
        aria-label={HOME_PAGE_RESPONSE.message}
      >
        <HeroSection />
        <CategoryStrip />
        <TrustSignalsBar />
        <PopularHallsSection />
        <CuratedServicesSection />
        {/* for future */}
        {/* <TrendingSection /> */}
        <HomeFooter />
        <MobileDock />

        <button
          type="button"
          className="fixed bottom-28 right-5 z-10 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary text-white shadow-[0_16px_28px_rgba(214,92,58,0.34)] md:hidden"
          aria-label="Open smart planner"
        >
          <Sparkles className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="fixed bottom-6 right-6 z-20 hidden items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(214,92,58,0.3)] md:inline-flex"
        >
          Smart Planner
        </button>
      </main>
    </>
  );
}

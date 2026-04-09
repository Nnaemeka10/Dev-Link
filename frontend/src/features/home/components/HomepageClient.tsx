"use client";

import { motion } from "framer-motion";
import CategoryStrip from "./CategoryStrip";
import CuratedServicesSection from "./CuratedServicesSection";
import HeroSection from "./HeroSection";
import HomeFooter from "./HomeFooter";
import MobileDock from "../../../components/layout/MobileDock";
import PopularHallsSection from "./PopularHallsSection";
import TrendingSection from "./TrendingSection";
import TrustSignalsBar from "./TrustSignalsBar";

const HOME_PAGE_RESPONSE = {
  status: "success",
  message: "Homepage payload fetched successfully",
};

export default function HomepageClient() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="bg-bg-primary"
      aria-label={HOME_PAGE_RESPONSE.message}
    >
      <HeroSection />
      <CategoryStrip />
      <TrustSignalsBar />
      <PopularHallsSection />
      <CuratedServicesSection />
      <TrendingSection />
      <HomeFooter />
      <MobileDock />

      <button
        type="button"
        className="fixed bottom-6 right-6 z-20 hidden items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(214,92,58,0.3)] md:inline-flex"
      >
        Smart Planner
      </button>
    </motion.main>
  );
}

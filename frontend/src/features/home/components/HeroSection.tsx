"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Search } from "lucide-react";
import mobileHero from "@/assets/home/mobilehero.png";

interface HeroTab {
  id: string;
  label: string;
  selected: boolean;
}

interface HeroResponse {
  headline: string;
  highlight: string;
  tabs: HeroTab[];
  wherePlaceholder: string;
  whenPlaceholder: string;
}

const HERO_RESPONSE: HeroResponse = {
  headline: "Curating Nigeria's Finest Events.",
  highlight: "Finest Events.",
  tabs: [
    { id: "halls", label: "Event Halls", selected: true },
    { id: "services", label: "Services", selected: false },
  ],
  wherePlaceholder: "Lagos, Abuja, PH...",
  whenPlaceholder: "Add dates",
};

export default function HeroSection() {
  return (
    <section className="home-hero-shell border-b border-text-primary/5 px-4 pb-8 pt-8 md:px-8 md:pb-12 md:pt-14">
      <div className="mx-auto max-w-7xl">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-text-primary md:text-[76px]"
        >
          Curating Nigeria{"'"}s <span className="text-accent-primary">{HERO_RESPONSE.highlight}</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mx-auto mt-8 hidden w-full max-w-5xl rounded-[28px] bg-white p-2 shadow-[0_10px_26px_rgba(26,31,60,0.12)] md:grid md:grid-cols-[220px_1fr_1fr_220px]"
        >
          <div className="flex items-center rounded-2xl bg-bg-primary p-1">
            {HERO_RESPONSE.tabs.map((tab) => (
              <button
                key={tab.id}
                className={`w-1/2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  tab.selected
                    ? "bg-white text-text-primary shadow-[0_3px_8px_rgba(26,31,60,0.08)]"
                    : "text-text-primary/55"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 border-l border-text-primary/10 px-5 py-3">
            <MapPin className="h-4 w-4 text-text-primary/50" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary/45">Where</p>
              <p className="text-sm text-text-primary/55">{HERO_RESPONSE.wherePlaceholder}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-text-primary/10 px-5 py-3">
            <CalendarDays className="h-4 w-4 text-text-primary/50" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary/45">When</p>
              <p className="text-sm text-text-primary/55">{HERO_RESPONSE.whenPlaceholder}</p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-primary px-6 py-3 text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.01]"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
          className="mt-6 md:hidden"
        >
          <div className="mx-auto max-w-[370px] overflow-hidden rounded-[36px] bg-[#05070b] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
            <Image
              src={mobileHero}
              alt="eventvnv mobile planner preview"
              className="h-auto w-full rounded-[28px]"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

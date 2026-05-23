"use client";

import { motion } from "framer-motion";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWatch } from "react-hook-form";
import { useSearchForm } from "../hooks/useSearchForm";
import { useHomeStore } from "../store/homeStore";
import { buildListingsHref } from "@/features/listings/searchParams";
import type { SearchFormData } from "../utils/searchSchema";
import DesktopSearchBar from "@/features/search/components/DesktopSearchBar";
import MobileSearchTrigger from "@/features/search/components/MobileSearchTrigger";
import MobileSearchModal from "@/features/search/components/MobileSearchModal";

/**
 * Utility: Format date for display
 */
function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

/**
 * HeroSection: Main orchestrator component
 *
 * Responsibilities:
 * - Initialize search form via useSearchForm hook
 * - Manage home search state via Zustand store
 * - Handle search submission (router.push to listings)
 * - Reset state on unmount (cleanup)
 * - Render layout and delegate UI to subcomponents
 */
export default function HeroSection() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Initialize form (uses Zustand for default values)
  const form = useSearchForm();

  // Reset Zustand state when leaving the home page
  useEffect(() => {
    return () => {
      useHomeStore.getState().resetSearch();
    };
  }, []);

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

  // Handle form submission
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
    <section className="home-hero-shell min-h-72">
      {/* Animated spotlights */}
      <div aria-hidden="true" className="hero-spotlight-layer">
        <div className="hero-spotlight hero-spotlight--gold" />
        <div className="hero-spotlight hero-spotlight--ember" />
      </div>

      <div className="relative z-10 px-4 pb-8 pt-20 md:px-8 md:pb-40 md:pt-40">
        <div className="flex flex-col-reverse md:flex-col gap-16">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-text-primary md:text-7xl"
          >
            Curating Nigeria{"'"}s <span className="text-accent-primary">Finest Events</span>
          </motion.h1>

          {/* Desktop Search Bar */}
          <DesktopSearchBar
            form={form}
            onSubmit={handleSearch}
            isPending={isPending}
          />

          {/* Mobile Search Trigger */}
          <MobileSearchTrigger mobileSummaryLines={mobileSummaryLines} />

          {/* Mobile Search Modal */}
          <MobileSearchModal form={form} onSubmit={handleSearch} isPending={isPending} />
        </div>
      </div>
    </section>
  );
}

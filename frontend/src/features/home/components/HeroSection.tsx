"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWatch } from "react-hook-form";
import { useSearchForm, buildListingsUrl, saveLastSearch } from "@/features/search";
import type { SearchFormData } from "@/features/search/utils/searchSchema";
import DesktopSearchBar from "@/features/search/components/DesktopSearchBar";
import MobileSearchTrigger from "@/features/search/components/MobileSearchTrigger";
import MobileSearchModal from "@/features/search/components/MobileSearchModal";

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function HeroSection() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useSearchForm();


  const selectedCategory = useWatch({ control: form.control, name: "category" });
  const selectedDateRange = useWatch({ control: form.control, name: "dateRange" });
  const selectedLocation = useWatch({ control: form.control, name: "location" });
  const selectedCoverage = useWatch({ control: form.control, name: "coverageArea" });
  const selectedCapacity = useWatch({ control: form.control, name: "capacity" });
  const selectedRole = useWatch({ control: form.control, name: "role" });

  const handleSearch = (data: SearchFormData) => {
    saveLastSearch(data); //persist before navigating
    startTransition(() => {
      router.push(buildListingsUrl(data));
    });
  };

  const mobileDateLabel = (() => {
    if (!selectedDateRange?.from) return "";
    if (!selectedDateRange.to) return formatDateLabel(selectedDateRange.from);
    return `${formatDateLabel(selectedDateRange.from)} - ${formatDateLabel(selectedDateRange.to)}`;
  })();

  const mobileSummaryLines = (() => {
    const lines: string[] = [];
    if (selectedCategory === "halls") {
      if (selectedLocation?.trim()) lines.push(selectedLocation.trim());
      if (selectedCapacity) lines.push(`${selectedCapacity} guests`);
      if (mobileDateLabel) lines.push(mobileDateLabel);
    } else {
      if (selectedCoverage?.trim()) lines.push(selectedCoverage.trim());
      if (selectedRole) lines.push(selectedRole);
      if (mobileDateLabel) lines.push(mobileDateLabel);
    }
    return lines;
  })();

  return (
    <section className="home-hero-shell min-h-72">
      <div aria-hidden="true" className="hero-spotlight-layer">
        <div className="hero-spotlight hero-spotlight--gold" />
        <div className="hero-spotlight hero-spotlight--ember" />
      </div>

      <div className="relative z-10 px-4 pb-8 pt-20 md:px-8 md:pb-40 md:pt-40">
        <div className="flex flex-col-reverse gap-16 md:flex-col">
          <h1 className="motion-safe:animate-fade-up mx-auto max-w-4xl text-center text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-text-primary md:text-7xl">
            Curating Nigeria&apos;s <span className="text-accent-primary">Finest Events</span>
          </h1>

          <DesktopSearchBar form={form} onSubmit={handleSearch} isPending={isPending} />
          <MobileSearchTrigger mobileSummaryLines={mobileSummaryLines} />
          <MobileSearchModal form={form} onSubmit={handleSearch} isPending={isPending} />
        </div>
      </div>
    </section>
  );
}
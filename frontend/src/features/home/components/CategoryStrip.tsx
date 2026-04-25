"use client";

import {
  Camera,
  Clapperboard,
  Drum,
  Mic,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
  CarIcon,
  House
} from "lucide-react";

interface CategoryItem {
  id: string;
  label: string;
  icon: "drum" | "mic" | "camera" | "video" | "planner" | "makeup" | "ushers" | "security" | "car-rental" | "hall-decorator";
}

interface CategoryResponse {
  data: CategoryItem[];
}

const CATEGORY_RESPONSE: CategoryResponse = {
  data: [
    { id: "dj", label: "DJ", icon: "drum" },
    { id: "mc", label: "MC", icon: "mic" },
    { id: "photographer", label: "Photographer", icon: "camera" },
    { id: "videographer", label: "Videographer", icon: "video" },
    { id: "planner", label: "Event Planner", icon: "planner" },
    { id: "makeup", label: "Make-up Artist", icon: "makeup" },
    { id: "ushers", label: "Ushers", icon: "ushers" },
    { id: "security", label: "Security", icon: "security" },
    { id: "car-rental", label: "Car Rental", icon: "car-rental" },
    { id: "hall-decorator", label: "Hall Decorator", icon: "hall-decorator" },
  ],
};

function iconByType(type: CategoryItem["icon"]) {
  switch (type) {
    case "drum":
      return Drum;
    case "mic":
      return Mic;
    case "camera":
      return Camera;
    case "video":
      return Clapperboard;
    case "planner":
      return Sparkles;
    case "makeup":
      return WandSparkles;
    case "ushers":
      return Users;
    case "car-rental":
      return CarIcon;
    case "hall-decorator":
      return House;
    default:
      return ShieldCheck;
  }
}

export default function CategoryStrip() {
  return (
    <section className="px-4 py-8 md:px-8 md:py-10 bg-bg-primary">
      <div className="mx-auto max-w-7xl">
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-10 md:gap-4 md:overflow-visible md:pb-0">
          {CATEGORY_RESPONSE.data.map((item, index) => {
            const Icon = iconByType(item.icon);
            return (
              <article
                key={item.id}
                className="flex min-w-21 flex-col items-center gap-2 md:min-w-0 motion-safe:animate-[var(--animate-fade-up)]"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-text-primary shadow-sm md:h-14 md:w-14">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-[11px] text-center font-semibold uppercase tracking-[0.05em] text-text-primary/72 md:text-xs md:normal-case md:tracking-normal">
                  {item.label}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

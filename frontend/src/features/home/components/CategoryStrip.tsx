"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Clapperboard,
  Drum,
  Mic,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";

interface CategoryItem {
  id: string;
  label: string;
  icon: "drum" | "mic" | "camera" | "video" | "planner" | "makeup" | "ushers" | "security";
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
    default:
      return ShieldCheck;
  }
}

export default function CategoryStrip() {
  return (
    <section className="border-b border-text-primary/6 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-8 md:gap-6 md:overflow-visible md:pb-0">
          {CATEGORY_RESPONSE.data.map((item, index) => {
            const Icon = iconByType(item.icon);
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.34, delay: index * 0.04 }}
                className="flex min-w-[84px] flex-col items-center gap-2 md:min-w-0"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-text-primary shadow-sm md:h-14 md:w-14">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-text-primary/72 md:text-xs md:normal-case md:tracking-normal">
                  {item.label}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

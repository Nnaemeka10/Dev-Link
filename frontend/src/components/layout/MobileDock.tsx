"use client";

import { CalendarDays, Compass, Heart, UserRound } from "lucide-react";

interface MobileDockItem {
  id: string;
  label: string;
  icon: "explore" | "saved" | "bookings" | "profile";
  selected: boolean;
}

interface MobileDockResponse {
  items: MobileDockItem[];
}

const MOBILE_DOCK_RESPONSE: MobileDockResponse = {
  items: [
    { id: "explore", label: "Explore", icon: "explore", selected: true },
    { id: "saved", label: "Saved", icon: "saved", selected: false },
    { id: "bookings", label: "Bookings", icon: "bookings", selected: false },
    { id: "profile", label: "Profile", icon: "profile", selected: false },
  ],
};

function dockIcon(icon: MobileDockItem["icon"]) {
  if (icon === "explore") return Compass;
  if (icon === "saved") return Heart;
  if (icon === "bookings") return CalendarDays;
  return UserRound;
}

export default function MobileDock() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-[1.75rem] border border-[#F1E5D5] bg-white/96 p-2 shadow-[0_18px_34px_rgba(26,31,60,0.08)] backdrop-blur">
        {MOBILE_DOCK_RESPONSE.items.map((item) => {
          const Icon = dockIcon(item.icon);
          return (
            <button
              key={item.id}
              type="button"
              className={`flex flex-col items-center justify-center gap-1 rounded-[1.15rem] py-3 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                item.selected
                  ? "bg-[#FFF1DE] text-[#5A2A12] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  : "text-text-primary/45"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

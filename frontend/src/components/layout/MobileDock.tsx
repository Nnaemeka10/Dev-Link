"use client";

import { CalendarDays, Compass, Heart, Plus, UserRound } from "lucide-react";

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
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-text-primary/10 bg-white/98 px-4 pb-4 pt-2 md:hidden">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary text-white shadow-[0_10px_24px_rgba(214,92,58,0.36)]"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto mt-4 grid max-w-md grid-cols-4 gap-2">
        {MOBILE_DOCK_RESPONSE.items.map((item) => {
          const Icon = dockIcon(item.icon);
          return (
            <button
              key={item.id}
              type="button"
              className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                item.selected ? "text-text-primary" : "text-text-primary/45"
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

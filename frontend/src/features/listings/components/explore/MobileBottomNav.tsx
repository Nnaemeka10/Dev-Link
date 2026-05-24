import { CalendarDays, Heart, Search, UserCircle } from "lucide-react";

const MOBILE_NAV_ITEMS = [
  { label: "Explore", icon: Search, active: true },
  { label: "Saved", icon: Heart, active: false },
  { label: "Bookings", icon: CalendarDays, active: false },
  { label: "Profile", icon: UserCircle, active: false },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EEE4D9] bg-[#FFFCF4] px-4 py-3 xl:hidden">
      <div className="grid grid-cols-4 gap-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-extrabold uppercase tracking-[0.06em] ${
                item.active ? "bg-[#B9401D] text-white" : "text-[#6B6E91]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

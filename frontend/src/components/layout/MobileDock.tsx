"use client";

import { Compass, Heart, MessageCircleMore, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileDockItem {
  id: string;
  label: string;
  icon: "explore" | "saved" | "Messages" | "profile";
  href: string;
}

const MOBILE_DOCK_ITEMS: MobileDockItem[] = [
  { id: "explore", label: "Explore", icon: "explore", href: "/" },
  { id: "saved", label: "Saved", icon: "saved", href: "/listings/saved" },
  { id: "Messages", label: "Messages", icon: "Messages", href: "/messages" },
  { id: "profile", label: "Profile", icon: "profile", href: "/profile" },
];

function dockIcon(icon: MobileDockItem["icon"]) {
  if (icon === "explore") return Compass;
  if (icon === "saved") return Heart;
  if (icon === "Messages") return MessageCircleMore;
  return UserRound;
}

export default function MobileDock() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-30  md:hidden">
      <div className="mx-auto grid grid-cols-4 gap-2 rounded-t-[1.75rem] border border-[#F1E5D5] bg-white/96 p-2 shadow-[0_18px_34px_rgba(26,31,60,0.08)] backdrop-blur">
        {MOBILE_DOCK_ITEMS.map((item) => {
          const Icon = dockIcon(item.icon);
          const isActive = 
            pathname === item.href || 
            (item.href === "/" && pathname.startsWith("/listings") && !pathname.startsWith("/listings/saved"));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-[1.15rem] py-3 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                isActive
                  ? "bg-[#FFF1DE] text-[#5A2A12] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  : "text-text-primary/45 hover:bg-[#F3EFE9]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { CalendarCheck, List, MessageCircleMore, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileDockItem {
  id: string;
  label: string;
  icon: "today" | "mylistings" | "messages" | "profile";
  href: string;
}

const VENDOR_MOBILE_DOCK_ITEMS: MobileDockItem[] = [
  { id: "today", label: "Today", icon: "today", href: "/vendor" },
  { id: "mylistings", label: "My Listings", icon: "mylistings", href: "/vendor/mylistings" },
  { id: "messages", label: "Messages", icon: "messages", href: "/vendor/messages" },
  { id: "profile", label: "Profile", icon: "profile", href: "/vendor/profile" },
];

function dockIcon(icon: MobileDockItem["icon"]) {
  if (icon === "today") return CalendarCheck;
  if (icon === "mylistings") return List;
  if (icon === "messages") return MessageCircleMore;
  return UserRound;
}

export default function VendorMobileDock() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-t-[1.75rem] border border-[#F1E5D5] bg-white/96 p-2 shadow-[0_18px_34px_rgba(26,31,60,0.08)] backdrop-blur">
        {VENDOR_MOBILE_DOCK_ITEMS.map((item) => {
          const Icon = dockIcon(item.icon);
          
          let isActive = false;
          if (item.id === "today") {
            isActive = pathname === "/vendor";
          } else if (item.id === "mylistings") {
            isActive = pathname.startsWith("/vendor/mylistings");
          } else {
            isActive = pathname.startsWith(item.href);
          }

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

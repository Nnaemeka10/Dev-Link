"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { List, CalendarCheck, MessageCircleMore, UserRound } from "lucide-react"; // Using similar icons but for Vendor context

const vendorNavLinks = [
  {
    id: "today",
    icon: CalendarCheck,
    label: "Today",
    href: "/vendor",
  },
  {
    id: "mylistings",
    icon: List,
    label: "My Listings",
    href: "/vendor/mylistings",
  },
  {
    id: "messages",
    icon: MessageCircleMore,
    label: "Messages",
    href: "/messages",
  },
  {
    id: "profile",
    icon: UserRound,
    label: "Profile",
    href: "/profile",
  },
];

export default function VendorSideNavBar() {
  const pathname = usePathname();

  return (
    <aside className="w-[15%] h-screen flex-col border-r border-[#F1E5D5] bg-[#f6f3ec] overflow-y-auto fixed hidden xl:flex">
      <div className="flex h-32 items-center border-b border-[#F1E5D5] px-6 font-semibold tracking-[-0.02em] text-text-primary shrink-0">
        <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
            <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
            <p className="font-semibold logo translate-y-1.5">EventVnV Host</p>
        </Link>
      </div>

      <div className="flex grow flex-col gap-2 py-8">
        {vendorNavLinks.map((link) => {
          const Icon = link.icon;
          
          let isActive = false;
          if (link.id === "today") {
            // Today is strictly the /vendor root
            isActive = pathname === "/vendor";
          } else if (link.id === "mylistings") {
            isActive = pathname.startsWith("/vendor/mylistings");
          } else {
            // For messages and profile
            isActive = pathname.startsWith(link.href);
          }

          return (
            <Link
              key={link.id}
              href={link.href}
              className={`mx-2 flex items-center gap-4 rounded-[1.15rem] px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] transition-transform ${
                isActive
                  ? "bg-[#FFF1DE] text-[#5A2A12] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  : "text-text-primary/45 hover:bg-white/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Exiting Host mode */}
      <div className="mt-auto px-4 pb-8">
        <Link href="/">
          <Button
            variant="outline"
            className="w-full py-4 text-xs font-bold uppercase tracking-wider"
          >
            Switch to Traveler
          </Button>
        </Link>
      </div>
    </aside>
  );
}

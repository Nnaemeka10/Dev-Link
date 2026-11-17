"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { List, CalendarCheck, MessageCircleMore, UserRound } from "lucide-react";

const vendorNavLinks = [
  { id: "today", icon: CalendarCheck, label: "Today", href: "/vendor" },
  { id: "mylistings", icon: List, label: "Listings", href: "/vendor/mylistings" },
  { id: "messages", icon: MessageCircleMore, label: "Messages", href: "/vendor/messages" },
  { id: "profile", icon: UserRound, label: "Profile", href: "/vendor/profile" },
];

const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40";

/** Booking + payout detail pages belong to the Today surface. */
function isLinkActive(id: string, pathname: string): boolean {
  if (id === "today") {
    return (
      pathname === "/vendor" ||
      pathname.startsWith("/vendor/bookings") ||
      pathname.startsWith("/vendor/transactions")
    );
  }
  if (id === "mylistings") {
    return (
      pathname.startsWith("/vendor/mylistings") ||
      pathname.startsWith("/vendor/create-listing")
    );
  }
  return pathname.startsWith(`/vendor/${id}`);
}

interface VendorSideNavBarProps {
  /**
   * true  - rendered inside an existing fixed-width slot (the dashboard and
   *         create-listing shells). Fills that slot instead of imposing its
   *         own 15% width, which used to overlap the content padding.
   * false - standalone: owns a fixed 15% column (My Listings, Messages).
   */
  embedded?: boolean;
}

export default function VendorSideNavBar({ embedded = false }: VendorSideNavBarProps) {
  const pathname = usePathname() ?? "";

  const shell = embedded
    ? `flex h-full w-full flex-col overflow-y-auto border-r border-[#F1E5D5] bg-[#f6f3ec] ${SCROLLBAR}`
    : `fixed hidden h-screen w-[15%] flex-col overflow-y-auto border-r border-[#F1E5D5] bg-[#f6f3ec] xl:flex ${SCROLLBAR}`;

  return (
    <aside className={shell}>
      <div className="flex h-32 shrink-0 items-center border-b border-[#F1E5D5] px-6">
        <Link
          href="/"
          className="flex items-end gap-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary"
        >
          <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
          <p className="logo translate-y-1.5 font-semibold">EventVnV Host</p>
        </Link>
      </div>

      <div className="flex grow flex-col gap-2 py-8">
        {vendorNavLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isLinkActive(link.id, pathname);
          return (
            <Link
              key={link.id}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`mx-2 flex items-center gap-4 rounded-[1.15rem] px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] transition-colors ${
                isActive
                  ? "bg-[#FFF1DE] text-[#5A2A12] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  : "text-text-primary/45 hover:bg-white/50"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-4 pb-8">
        <Link href="/">
          <Button
            variant="primary"
            className="w-full py-4 text-xs font-bold uppercase tracking-wider"
          >
            Switch to Client
          </Button>
        </Link>
      </div>
    </aside>
  );
}
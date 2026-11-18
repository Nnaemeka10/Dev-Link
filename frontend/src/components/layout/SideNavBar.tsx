"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Compass, Heart, MessageCircleMore, UserRound } from "lucide-react";
import { useVendorSwitch } from "../../hooks/useVendorSwitch";

const navLinks = [
  { id: "explore", icon: Compass, label: "Explore", href: "/" },
  { id: "saved", icon: Heart, label: "Saved", href: "/saved" },
  { id: "messages", icon: MessageCircleMore, label: "Messages", href: "/messages" },
  { id: "profile", icon: UserRound, label: "Profile", href: "/profile" },
];

const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#D8CDBF_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40";

export default function SideNavBar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { isVendor, target } = useVendorSwitch();

  return (
    <aside
      className={`fixed hidden h-screen w-[15%] flex-col overflow-y-auto border-r border-[#F1E5D5] bg-[#f6f3ec] xl:flex ${SCROLLBAR}`}
    >
      <div className="flex h-32 shrink-0 items-center border-b border-[#F1E5D5] px-6 font-semibold tracking-[-0.02em] text-text-primary">
        <Link
          href="/"
          className="flex items-end gap-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary"
        >
          <Image src="/logo.svg" alt="EventVnV" width={30} height={30} />
          <span className="logo translate-y-1.5 font-semibold">EventVnV</span>
        </Link>
      </div>

      <div className="flex grow flex-col gap-2 py-8">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href === "/" &&
              pathname.startsWith("/listings") &&
              !pathname.startsWith("/saved"));
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
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-4 pb-8">
        <Button
          variant="primary"
          className="w-full py-4 text-xs font-bold uppercase tracking-wider"
          onClick={() => router.push(target.href)}
        >
          {isVendor ? "Go to Vendor" : "Become a Vendor"}
        </Button>
      </div>
    </aside>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Compass, Heart, MessageCircleMore, UserRound } from "lucide-react";

const navLinks = [
  {
    id: "explore",
    icon: Compass,
    label: "Explore",
    href: "/",
  },
  {
    id: "saved",
    icon: Heart,
    label: "Saved",
    href: "/listings/saved",
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

export default function SideNavBar() {
  const pathname = usePathname();

  return (
    <aside className="w-[15%] h-screen flex-col border-r border-[#F1E5D5] bg-[#f6f3ec] overflow-y-auto fixed hidden xl:flex">
      <div className="flex h-32 items-center border-b border-[#F1E5D5] px-6 font-semibold tracking-[-0.02em] text-text-primary shrink-0">
        <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
            <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
            <p className="font-semibold logo translate-y-1.5">EventVnV </p>
        </Link>
      </div>

      <div className="flex grow flex-col gap-2 py-8">
        {navLinks.map((link) => {
          const Icon = link.icon;
          // Consider a link active if the current pathname matches its href exactly,
          // or if it's the root path ("/") and we are on a listings path (but not '/listings/saved')
          const isActive = 
            pathname === link.href || 
            (link.href === "/" && pathname.startsWith("/listings") && !pathname.startsWith("/listings/saved"));

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

      <div className="mt-auto px-4 pb-8">
        <Button
          variant="primary"
          className="w-full py-4 text-xs font-bold uppercase tracking-wider"
        >
          List your space
        </Button>
      </div>
    </aside>
  );
}

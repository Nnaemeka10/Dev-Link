"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import UserMenu from "./UserMenu";

import Image from "next/image";

const links = [
  { href: "/", label: "Explore" },
  { href: "/dashboard", label: "Become a Vendor" },
  { href: "/profile", label: "Help" },
];

export default function Navbar() {
  const pathname = usePathname();

  if (pathname?.startsWith("/listings") || pathname?.startsWith("/bookings")) {
    return null;
  }

return (
    <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md">
      {/* Desktop View */}
      <div className="hidden items-center justify-between pad md:flex">
        <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
          <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
          <p className="font-semibold logo translate-y-1.5">EventVnV </p>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "text-text-primary underline decoration-accent-primary decoration-2 underline-offset-4 font-bold"
                    : "text-text-primary/68 hover:text-text-primary font-medium"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <UserMenu />
      </div>

      {/* Mobile View */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 md:hidden">
        <Link href="/" className="flex min-w-0 flex-1 items-end gap-1 text-text-primary">
          <Image src="/logo.svg" alt="EventVnv" width={26} height={26} />
          <span className="logo translate-y-1 truncate font-semibold">EventVnV</span>
        </Link>

        <UserMenu />
      </div>
    </header>
  );
}

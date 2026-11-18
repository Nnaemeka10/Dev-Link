"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import UserMenu from "./UserMenu";
import { useVendorSwitch } from "../../hooks/useVendorSwitch";

interface NavbarProps {
  /**
   * "client" - the marketplace navbar (hidden on /listings and /bookings,
   *            which render their own search/detail headers).
   * "vendor" - rendered inside the vendor shell in place of the old
   *            name + avatar cluster. Always visible.
   */
  variant?: "client" | "vendor";
  unreadMessages?: number;
}

export default function Navbar({
  variant = "client",
  unreadMessages = 0,
}: NavbarProps) {
  const pathname = usePathname() ?? "";
  const { target } = useVendorSwitch();
  const SwitchIcon = target.icon;
  const isVendorVariant = variant === "vendor";

  // Detail and explore surfaces own their headers.
  if (
    !isVendorVariant &&
    (pathname.startsWith("/listings") || pathname.startsWith("/bookings"))
  ) {
    return null;
  }

  const links = isVendorVariant
    ? [{ href: "/help", label: "Help" }]
    : [
        { href: "/", label: "Explore" },
        { href: "/help", label: "Help" },
      ];

  const messagesHref = isVendorVariant ? "/vendor/messages" : "/messages";

  const switchPill = (
    <Link
      href={target.href}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent-primary/25 bg-accent-tint px-3 py-2 text-xs font-bold text-accent-primary transition-all duration-200 hover:border-accent-primary hover:bg-accent-primary hover:text-white hover:shadow-[0_8px_18px_rgba(214,92,58,0.24)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
    >
      <SwitchIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">{target.label}</span>
      <span className="sm:hidden">{target.shortLabel}</span>
    </Link>
  );

  const messagesLink = (
    <Link
      href={messagesHref}
      aria-label={
        unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : "Messages"
      }
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-primary/55 transition-colors hover:bg-bg-tertiary hover:text-accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
    >
      <MessageSquare className="h-5 w-5" aria-hidden="true" />
      {unreadMessages > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-extrabold leading-none text-white">
          {unreadMessages > 9 ? "9+" : unreadMessages}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[#F1E5D5]/70 bg-bg-primary/90 backdrop-blur-md">
      {/* Desktop */}
      <div className="hidden items-center gap-6 px-4 py-4 md:flex md:px-8 lg:px-12">
        <Link
          href="/"
          className="flex shrink-0 items-end gap-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary"
        >
          <Image src="/logo.svg" alt="EventVnV" width={30} height={30} />
          <span className="logo translate-y-1.5 font-semibold">
            EventVnV{isVendorVariant ? " Host" : ""}
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1" aria-label="Main">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "font-bold text-text-primary underline decoration-accent-primary decoration-2 underline-offset-4"
                    : "font-medium text-text-primary/68 hover:text-text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {switchPill}
          {isVendorVariant && messagesLink}
          <UserMenu />
        </div>
      </div>

      {/* Mobile / tablet */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 md:hidden">
        <Link
          href="/"
          className="flex min-w-0 items-end gap-1 text-text-primary"
        >
          <Image src="/logo.svg" alt="EventVnV" width={26} height={26} />
          <span className="logo translate-y-1 truncate font-semibold">
            EventVnV
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          {switchPill}
          {isVendorVariant && messagesLink}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
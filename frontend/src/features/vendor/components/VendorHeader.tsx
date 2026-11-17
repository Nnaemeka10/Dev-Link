"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { VendorProfile } from "../types";
import { initialsOf } from "../utils";

interface VendorHeaderProps {
  vendor: VendorProfile;
}

export default function VendorHeader({ vendor }: VendorHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between gap-3 border-b border-[#F0E9DF] bg-bg-primary/90 px-4 backdrop-blur-xl xs:px-6 md:px-8">
      <Link
        href="/vendor"
        className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#9A9AAE] transition-colors hover:text-[#252423]"
      >
        EventVnV Host
      </Link>

      <div className="flex items-center gap-3 xs:gap-4">
        <Link
          href="/vendor/messages"
          aria-label={
            vendor.unreadMessages > 0
              ? `Messages, ${vendor.unreadMessages} unread`
              : "Messages"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#5E6588] transition-colors hover:bg-[#F4F1EA] hover:text-[#B9401D]"
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          {vendor.unreadMessages > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B9401D] px-1 text-[10px] font-extrabold leading-none text-white">
              {vendor.unreadMessages > 9 ? "9+" : vendor.unreadMessages}
            </span>
          )}
        </Link>

        <span className="h-8 w-px bg-[#E8DDD2]" aria-hidden="true" />

        <Link
          href="/vendor/profile"
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[#F4F1EA]"
        >
          <span className="hidden text-sm font-bold text-[#252423] xs:inline">
            {vendor.name}
          </span>
          {vendor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatars may be Google-hosted
            <img
              src={vendor.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full object-cover ring-1 ring-[#F0E9DF]"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7D1C8] text-xs font-extrabold text-[#B9401D]"
            >
              {initialsOf(vendor.name)}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
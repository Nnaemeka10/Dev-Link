"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VendorHeader from "./VendorHeader";
import VendorSideNavBar from "@/components/layout/VendorSideNavBar";
import VendorMobileDock from "@/components/layout/VendorMobileDock";
import { useAuth } from "@/features/auth/useAuth";
import type { VendorProfile } from "../types";

/**
 * One identity derivation for every vendor surface. Names fall back through
 * first + last → email local-part → "Vendor", so a Google account with no
 * given_name never renders "null null" in the header.
 */
export function useVendorIdentity(): VendorProfile {
  const { user } = useAuth();
  const fullName = [user?.firstName, user?.lastName]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const emailHandle = (user?.email ?? "").split("@")[0]?.trim();

  return {
    id: user?.id?.toString() ?? "",
    name: fullName || emailHandle || "Vendor",
    firstName: (user?.firstName ?? "").trim() || emailHandle || "there",
    avatarUrl: user?.avatarUrl ?? "",
    isFirstVisit: false,
    unreadMessages: 0,
  };
}

interface VendorPageShellProps {
  children: ReactNode;
  back?: { href: string; label: string };
  /** narrow = detail pages, default = full-width dashboards/ledgers. */
  width?: "default" | "narrow";
}

/**
 * Identical chrome to the dashboard: fixed 16rem rail on xl, sticky header,
 * bottom dock below xl. Detail pages are children of Today, so the dock's
 * Today tab stays lit (see VendorMobileDock.isItemActive).
 */
export default function VendorPageShell({
  children,
  back,
  width = "default",
}: VendorPageShellProps) {
  const vendor = useVendorIdentity();
  const widthClass = width === "narrow" ? "max-w-5xl" : "max-w-400";

  return (
    <div className="min-h-screen bg-bg-primary">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 xl:block">
        <VendorSideNavBar embedded />
      </aside>

      <div className="xl:pl-64">
        <VendorHeader vendor={vendor} />

        <main
          className={`mx-auto flex w-full flex-col gap-5 px-4 pb-32 pt-5 xs:px-6 md:gap-7 md:px-8 md:pb-12 md:pt-8 ${widthClass}`}
        >
          {back && (
            <Link
              href={back.href}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-tiny font-extrabold text-[#5E6588] shadow-[0_4px_14px_rgba(36,28,18,0.05)] transition-colors hover:text-[#B9401D] md:text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {back.label}
            </Link>
          )}
          {children}
        </main>
      </div>

      <VendorMobileDock />
    </div>
  );
}
"use client";

import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, Store, type LucideIcon } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";

export interface VendorSwitchTarget {
  href: string;
  label: string;
  /** Compact label for narrow viewports. */
  shortLabel: string;
  icon: LucideIcon;
}

/**
 * Single source of truth for the contextual vendor/client switch.
 *
 * `isVendor` is DERIVED server-side on /api/auth/me (a published or
 * pending-review listing exists) - never a stored flag, never inferred from
 * the URL, so it cannot drift when a listing is published or removed.
 *
 *  not a vendor            → Become a Vendor  → the create-listing wizard
 *  vendor on client pages  → Go to Vendor     → the vendor dashboard
 *  vendor on vendor pages  → Go to Client     → the marketplace
 *
 * Consumed by Navbar, UserMenu and SideNavBar so all three always agree.
 */
export function useVendorSwitch(): {
  isVendor: boolean;
  onVendorSurface: boolean;
  target: VendorSwitchTarget;
} {
  const { user } = useAuth();
  const pathname = usePathname() ?? "";

  const onVendorSurface = pathname.startsWith("/vendor");
  const isVendor = user?.isVendor === true;

  const target: VendorSwitchTarget = !isVendor
    ? {
        href: "/vendor/create-listing",
        label: "Become a Vendor",
        shortLabel: "Sell",
        icon: Store,
      }
    : onVendorSurface
      ? { href: "/", label: "Go to Client", shortLabel: "Client", icon: Compass }
      : {
          href: "/vendor",
          label: "Go to Vendor",
          shortLabel: "Vendor",
          icon: LayoutDashboard,
        };

  return { isVendor, onVendorSurface, target };
}
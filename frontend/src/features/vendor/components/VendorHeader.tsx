"use client";

import Navbar from "@/components/layout/Navbar";
import type { VendorProfile } from "../types";

interface VendorHeaderProps {
  /**
   * Retained for callers that pass the dashboard profile. Identity and
   * navigation come from the shared Navbar; unread is sourced live from the
   * chat query, so a stale `0` on the profile can never suppress the badge.
   */
  vendor?: VendorProfile;
}

export default function VendorHeader({ vendor }: VendorHeaderProps) {
  const override = vendor?.unreadMessages ? vendor.unreadMessages : undefined;
  return <Navbar variant="vendor" unreadMessages={override} />;
}
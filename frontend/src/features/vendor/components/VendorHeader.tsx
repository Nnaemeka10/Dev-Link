"use client";

import Navbar from "@/components/layout/Navbar";
import type { VendorProfile } from "../types";

interface VendorHeaderProps {
  /**
   * Kept for the unread badge. Identity and navigation now come from the
   * shared Navbar (logo + contextual client/vendor switch + user menu),
   * replacing the old name + avatar cluster.
   */
  vendor?: VendorProfile;
}

export default function VendorHeader({ vendor }: VendorHeaderProps) {
  return <Navbar variant="vendor" unreadMessages={vendor?.unreadMessages ?? 0} />;
}
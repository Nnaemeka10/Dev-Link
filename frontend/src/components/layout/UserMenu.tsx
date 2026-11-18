"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  UserCircle2,
  LogOut,
  MessageSquare,
  LifeBuoy,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { apiFetch } from "@/lib/api";
import { getCurrentReturnTo, withReturnTo } from "@/features/auth/auth.utils";
import { useVendorSwitch } from "../../hooks/useVendorSwitch";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, clearAuth, queryClient } = useAuth();
  const { target, onVendorSurface } = useVendorSwitch();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        redirectOn401: false,
      });
    } finally {
      clearAuth();
      // Clear the WHOLE cache, not just the session: saved listings,
      // bookings and vendor data must never survive into the next account
      // signed in on this device.
      queryClient.clear();
      setIsOpen(false);
    }
  };

  const displayName =
    [user?.firstName, user?.lastName]
      .map((part) => (part ?? "").trim())
      .filter(Boolean)
      .join(" ") ||
    (user?.email ?? "").split("@")[0] ||
    "Guest";

  const menuItems = isAuthenticated
    ? [
        {
          href: onVendorSurface ? "/vendor/profile" : "/profile",
          label: "Profile",
          icon: UserCircle2,
        },
        { href: target.href, label: target.label, icon: target.icon },
        {
          href: onVendorSurface ? "/vendor/messages" : "/messages",
          label: "Messages",
          icon: MessageSquare,
        },
        { href: "/help", label: "Help Center", icon: LifeBuoy },
      ]
    : [
        {
          href: withReturnTo("/login", getCurrentReturnTo()),
          label: "Log in",
          icon: UserCircle2,
        },
        {
          href: withReturnTo("/signup", getCurrentReturnTo()),
          label: "Sign up",
          icon: UserPlus,
        },
        { href: "/help", label: "Help Center", icon: LifeBuoy },
      ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User menu"
        className="flex items-center gap-2 rounded-full border border-[#E8DDD2] bg-white py-1.5 pl-3 pr-2 transition-all duration-200 hover:shadow-[0_6px_16px_rgba(36,28,18,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
      >
        <Menu className="h-4 w-4 text-text-primary/70" aria-hidden="true" />
        <span className="flex items-center justify-center overflow-hidden rounded-full">
          {isAuthenticated && user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatars may be Google-hosted
            <img
              src={user.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-7 w-7 object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center bg-[#F7D1C8] text-tiny font-bold uppercase text-accent-primary"
            >
              {displayName.charAt(0)}
            </span>
          )}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-[#F0E9DF] bg-white py-2 shadow-[0_18px_44px_rgba(36,28,18,0.16)] md:w-64"
          >
            {isAuthenticated && (
              <div className="border-b border-[#F0E9DF] px-4 pb-3 pt-1">
                <p className="truncate text-sm font-extrabold text-text-primary">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-tiny font-semibold text-text-primary/45">
                  {user?.email}
                </p>
              </div>
            )}

            <div className="pt-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isSwitch = item.href === target.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      isSwitch
                        ? "text-accent-primary hover:bg-accent-tint"
                        : "text-text-primary/80 hover:bg-bg-tertiary"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isSwitch ? "text-accent-primary" : "text-text-primary/45"
                      }`}
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {isAuthenticated && (
              <>
                <div className="my-2 border-t border-[#F0E9DF]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary/80 transition-colors hover:bg-bg-tertiary"
                >
                  <LogOut
                    className="h-4 w-4 shrink-0 text-text-primary/45"
                    aria-hidden="true"
                  />
                  Log out
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
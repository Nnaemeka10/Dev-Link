"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, UserCircle2, LogOut, Briefcase, MessageSquare, HelpCircle } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { apiFetch } from "@/lib/api";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, clearAuth, queryClient } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", redirectOn401: false });
    } finally {
      clearAuth();
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      setIsOpen(false);
    }
  };

  const menuItems = isAuthenticated
    ? [
        { href: "/profile", label: "Profile", icon: UserCircle2 },
        { href: "/vendor", label: "Become a Vendor", icon: Briefcase },
        { href: "/messages", label: "Messages", icon: MessageSquare },
      ]
    : [
        { href: "/login", label: "Log in", icon: UserCircle2 },
        { href: "/signup", label: "Sign up", icon: UserCircle2 },
      ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-3 pr-2 transition-all duration-200 hover:shadow-md"
        aria-label="User menu"
      >
        <Menu className="h-4 w-4 text-gray-700" />
        <div className="flex items-center justify-center overflow-hidden rounded-full">
          {isAuthenticated && user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={user.avatarUrl} 
              alt="Avatar" 
              className="h-7 w-7 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center bg-gray-500 text-[10px] font-bold uppercase text-white">
              {user?.firstName?.charAt(0) || "G"}
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-32 md:w-64 origin-top-right rounded-2xl border border-gray-100 bg-white py-2 shadow-xl z-50"
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 md:text-sm text-tiny font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4 text-gray-500" />
                  {item.label}
                </Link>
              );
            })}

            <div className="my-2 border-t border-gray-100" />

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
                Log out
              </button>
            ) : (
               <Link
                href="/"
                className="flex items-center gap-3 px-4 py-2.5 md:text-sm text-tiny font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="h-4 w-4 text-gray-500" />
                Help Center
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
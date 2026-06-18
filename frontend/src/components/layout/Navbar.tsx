"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";
import { apiFetch } from "@/lib/api";
import Image from "next/image";

const links = [
  { href: "/", label: "Explore" },
  { href: "/dashboard", label: "Become a Vendor" },
  { href: "/profile", label: "Help" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, refetchAuth, clearAuth, queryClient } = useAuth();

  if (pathname?.startsWith("/listings") || pathname?.startsWith("/bookings")) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", redirectOn401: false });
    } finally {
      clearAuth();
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md">
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

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-text-primary/80 md:inline">{user?.firstName} {user?.lastName}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="xs">Login</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-5 md:hidden">
        <Link href="/" className="flex min-w-0 flex-1 items-end gap-1 text-text-primary">
          <Image src="/logo.svg" alt="EventVnv" width={26} height={26} />
          <span className="logo translate-y-1 truncate font-semibold">EventVnV</span>
        </Link>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-w-[4.25rem] items-center justify-center rounded-full bg-accent-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(214,92,58,0.22)]"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex min-w-[4.25rem] items-center justify-center rounded-full bg-accent-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(214,92,58,0.22)]"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

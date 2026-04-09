"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";
import { apiFetch } from "@/lib/api";

const links = [
  { href: "/", label: "Explore" },
  { href: "/dashboard", label: "Become a Vendor" },
  { href: "/profile", label: "Help" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, refetchAuth } = useAuth();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", redirectOn401: false });
    } finally {
      await refetchAuth();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-text-primary/8 bg-bg-primary/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 md:px-6">
        <Link href="/" className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
          EventVnv
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-text-primary underline decoration-accent-primary decoration-2 underline-offset-4"
                    : "text-text-primary/68 hover:text-text-primary"
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
              <span className="hidden text-sm text-text-primary/80 md:inline">{user?.email}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="primary">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

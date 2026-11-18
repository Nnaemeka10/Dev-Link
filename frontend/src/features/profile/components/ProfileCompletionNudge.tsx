"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, MapPin, Phone, Sparkles, UserRound } from "lucide-react";
import HubModal from "@/features/saved/components/HubModal";
import { useAuth } from "@/features/auth/useAuth";

/**
 * Periodic profile-completion nudge.
 *
 * Cadence contract:
 *  - at most ONE show per browser session (sessionStorage guard),
 *  - "Remind me later" snoozes for 7 days (localStorage),
 *  - closing via X / backdrop suppresses only the current session,
 *  - never appears on auth pages, either profile page, the checkout
 *    wizard or the create-listing wizard - those flows own the screen,
 *  - disappears for good once name, phone and location are all filled.
 *
 * Mounted once in app/providers.tsx. Reads the same ["auth","me"] query
 * every other surface uses; useProfile invalidates it after edits, so a
 * completed profile stops nudging without a reload.
 */

const STORAGE_KEY = "eventvnv:profile-nudge:v1";
const SESSION_KEY = "eventvnv:profile-nudge:shown";
const SNOOZE_DAYS = 7;
const SHOW_DELAY_MS = 8_000;

const EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/profile",
  "/vendor/profile",
  "/bookings",
  "/vendor/create-listing",
];

function readSnoozedUntil(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { snoozedUntil?: unknown };
    return typeof parsed?.snoozedUntil === "number" ? parsed.snoozedUntil : 0;
  } catch {
    return 0;
  }
}

function writeSnooze(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ snoozedUntil: Date.now() + SNOOZE_DAYS * 86_400_000 })
    );
  } catch {
    /* private mode / quota - non-fatal */
  }
}

function sessionAlreadyShown(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSessionShown(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* non-fatal */
  }
}

interface MissingField {
  key: string;
  label: string;
  hint: string;
  icon: React.ElementType;
}

export default function ProfileCompletionNudge() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { isAuthenticated, loading, user } = useAuth();
  const [open, setOpen] = useState(false);

  const missing = useMemo<MissingField[]>(() => {
    if (!user) return [];
    const items: MissingField[] = [];
    const first = (user.firstName ?? "").trim();
    const last = (user.lastName ?? "").trim();
    if (!first || !last) {
      items.push({
        key: "name",
        label: "Your full name",
        hint: "Shown on bookings, receipts and messages",
        icon: UserRound,
      });
    }
    if (!(user.phone ?? "").trim()) {
      items.push({
        key: "phone",
        label: "Phone number",
        hint: "So vendors can reach you on event day",
        icon: Phone,
      });
    }
    if (!(user.location ?? "").trim()) {
      items.push({
        key: "location",
        label: "Primary location",
        hint: "Helps us surface venues and services near you",
        icon: MapPin,
      });
    }
    return items;
  }, [user]);

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    if (missing.length === 0) return;
    if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return;
    if (sessionAlreadyShown()) return;
    if (readSnoozedUntil() > Date.now()) return;

    // Let the page settle first - never hijack the first paint.
    const timer = window.setTimeout(() => {
      markSessionShown();
      setOpen(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [loading, isAuthenticated, user, missing.length, pathname]);

  if (!open || missing.length === 0) return null;

  const profilePath = pathname.startsWith("/vendor")
    ? "/vendor/profile"
    : "/profile";

  function handleComplete() {
    setOpen(false);
    router.push(profilePath);
  }

  function handleLater() {
    writeSnooze();
    setOpen(false);
  }

  return (
    <HubModal
      isOpen={open}
      title="Finish setting up your profile"
      subtitle="Takes less than a minute"
      onClose={() => setOpen(false)}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D65C3A]/10 text-[#D65C3A]">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="pt-1 text-sm font-semibold leading-6 text-stone-600">
            A complete profile means your bookings and receipts show the right
            name, and vendors can reach you when it matters.
          </p>
        </div>

        <ul className="space-y-2.5">
          {missing.map((field) => (
            <li
              key={field.key}
              className="flex items-center gap-3 rounded-2xl border border-[#F0E9DF] bg-white px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F2EA] text-[#D65C3A]">
                <field.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-stone-800">
                  {field.label}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-stone-400">
                  {field.hint}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Missing
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleComplete}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D65C3A] py-3.5 text-sm font-extrabold text-white transition-all hover:bg-[#c24e2f] active:scale-[0.99]"
          >
            Complete my profile
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleLater}
            className="w-full rounded-full py-2.5 text-sm font-bold text-stone-400 transition-colors hover:text-stone-600"
          >
            Remind me in {SNOOZE_DAYS} days
          </button>
        </div>

        <p className="text-center text-[11px] font-semibold text-stone-300">
          You can update these anytime in Profile → Personal information.
        </p>
      </div>
    </HubModal>
  );
}
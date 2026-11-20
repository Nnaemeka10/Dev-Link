"use client";

import Link from "next/link";
import { MessageSquare, Search } from "lucide-react";

interface EmptyStateProps {
  variant?: "no-selection" | "no-conversations" | "no-messages" | "no-results";
  onContactSupport?: () => void;
}

const COPY = {
  "no-selection": {
    title: "Your messages",
    body: "Pick a conversation to read it, or message a vendor from any hall or service.",
  },
  "no-conversations": {
    title: "No conversations yet",
    body: "When you message a vendor about a hall or service, the conversation shows up here.",
  },
  "no-messages": {
    title: "Say hello",
    body: "Ask about availability, pricing or what's included. Keep it here so escrow protection applies.",
  },
  "no-results": {
    title: "Nothing matches",
    body: "Try a different name, listing or word from the conversation.",
  },
} as const;

export function EmptyState({ variant = "no-selection", onContactSupport }: EmptyStateProps) {
  const copy = COPY[variant];

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF1E6] text-[#B9401D]">
        <MessageSquare className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-5 font-headline text-lg font-bold text-[#252423]">{copy.title}</p>
      <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-[#9A9AAE]">{copy.body}</p>

      {variant === "no-conversations" && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-full bg-[#B9401D] px-6 py-3 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.98]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse listings
          </Link>
          {onContactSupport && (
            <button
              type="button"
              onClick={onContactSupport}
              className="rounded-full border border-[#E8DDD2] px-6 py-3 text-sm font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
            >
              Contact support
            </button>
          )}
        </div>
      )}
    </div>
  );
}
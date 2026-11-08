"use client";

import { useCallback, useState } from "react";
import type { LocationSuggestion } from "./useLocationSuggestions";

const KEY = "eventvnv:recent-searches";
const MAX = 5;

export type WhereMode = "location" | "coverage";

interface RecentEntry {
  value: string;
  mode: WhereMode;
  at: number;
}

function read(mode: WhereMode): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentEntry[];
    return Array.isArray(all)
      ? all.filter((e) => e?.mode === mode && typeof e.value === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Recents are read at *open time* (event callbacks), never in an effect ,
 * keeps SSR/hydration clean and satisfies set-state-in-effect.
 */
export function useRecentSearches(mode: WhereMode) {
  const [recents, setRecents] = useState<RecentEntry[]>([]);

  const refresh = useCallback(() => setRecents(read(mode)), [mode]);

  const add = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < 2) return;
      try {
        const all = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentEntry[];
        const next = [
          { value: trimmed, mode, at: Date.now() },
          ...all.filter((e) => !(e?.mode === mode && e.value === trimmed)),
        ];
        localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
      } catch {
        /* non-fatal */
      }
      refresh();
    },
    [mode, refresh]
  );

  return { recents, refresh, add };
}
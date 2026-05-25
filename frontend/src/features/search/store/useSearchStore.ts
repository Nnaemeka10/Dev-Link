"use client";

import { create } from "zustand";
import type { DateRange, SearchCategory, SearchState } from "../types/search.types";

/**
 * SIMPLIFIED ZUSTAND STORE
 * 
 * Philosophy: Zustand is ONLY for mobile UI state.
 * Search params come from URL on listings page.
 * Form owns state on home page.
 * 
 * No bidirectional sync. No dual-write patterns.
 * Only hydration from URL (one-directional).
 */

interface SearchStoreActions {
  // UI state only
  setIsMobileSearchOpen: (isOpen: boolean) => void;

  // One-directional URL sync (listings page only)
  // Called by useSearchUrlSync after parsing URL
  hydrateFromUrl: (state: Partial<SearchState>) => void;

  // Reset for home page cleanup (clear params, keep UI state)
  resetParams: () => void;
}

export type SearchStore = SearchState & SearchStoreActions;

const initialState: SearchState = {
  category: "halls",
  location: "",
  dateRange: undefined,
  capacity: undefined,
  role: undefined,
  isMobileSearchOpen: false,
};

export const useSearchStore = create<SearchStore>((set) => ({
  ...initialState,

  // UI state control
  setIsMobileSearchOpen: (isMobileSearchOpen) => set({ isMobileSearchOpen }),

  // URL sync (one-way: URL → store)
  // Called after parsing URL; only used on listings page
  hydrateFromUrl: (state) => set(state),

  // Reset search params to defaults (keep isMobileSearchOpen)
  // Used on home page mount to ensure fresh start
  resetParams: () => set({
    category: "halls",
    location: "",
    dateRange: undefined,
    capacity: undefined,
    role: undefined,
  }),
}));

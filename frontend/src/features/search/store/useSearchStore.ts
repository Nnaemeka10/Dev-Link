"use client";

import { create } from "zustand";
import type { SearchState } from "../types/search.types";

/**
 * Zustand is ONLY for UI state + one-way URL hydration on the listings page.
 * Last-search persistence lives in lib/lastSearch.ts (localStorage).
 */
interface SearchStoreActions {
  setIsMobileSearchOpen: (isOpen: boolean) => void;
  hydrateFromUrl: (state: Partial<SearchState>) => void;
  resetParams: () => void;
}

export type SearchStore = SearchState & SearchStoreActions;

const initialState: SearchState = {
  category: "halls",
  location: "",
  coverageArea: "",
  dateRange: undefined,
  capacity: undefined,
  role: undefined,
  flexible: 0,
  isMobileSearchOpen: false,
};

export const useSearchStore = create<SearchStore>((set) => ({
  ...initialState,

  setIsMobileSearchOpen: (isMobileSearchOpen) => set({ isMobileSearchOpen }),

  hydrateFromUrl: (state) => set(state),

  resetParams: () =>
    set({
      category: "halls",
      location: "",
      coverageArea: "",
      dateRange: undefined,
      capacity: undefined,
      role: undefined,
      flexible: 0,
    }),
}));
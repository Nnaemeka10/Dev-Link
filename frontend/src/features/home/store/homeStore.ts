"use client";

import { create } from "zustand";
import type { DateRange } from "../utils/searchSchema";


interface HomeStore {
  // State
  category: "halls" | "services";
  location: string;
  dateRange: DateRange | undefined;
  isMobileSearchOpen: boolean;

  // Actions
  setCategory: (category: "halls" | "services") => void;
  setLocation: (location: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
  setIsMobileSearchOpen: (isOpen: boolean) => void;
  resetSearch: () => void;
}


export const useHomeStore = create<HomeStore>((set) => ({
  // Initial state
  category: "halls",
  location: "",
  dateRange: undefined,
  isMobileSearchOpen: false,

  // Actions
  setCategory: (category) => set({ category }),
  setLocation: (location) => set({ location }),
  setDateRange: (dateRange) => set({ dateRange }),
  setIsMobileSearchOpen: (isMobileSearchOpen) => set({ isMobileSearchOpen }),

  // Reset to initial state
  resetSearch: () =>
    set({
      category: "halls",
      location: "",
      dateRange: undefined,
      isMobileSearchOpen: false,
    }),
}));

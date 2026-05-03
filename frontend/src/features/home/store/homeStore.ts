"use client";

import { create } from "zustand";
import type { DateRange } from "../utils/searchSchema";


interface HomeStore {
  // State
  category: "halls" | "services";
  location: string;
  dateRange: DateRange | undefined;
  capacity: number | undefined;
  role: string | undefined;
  isMobileSearchOpen: boolean;

  // Actions
  setCategory: (category: "halls" | "services") => void;
  setLocation: (location: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
  setCapacity: (capacity: number | undefined) => void;
  setRole: (role: string | undefined) => void;
  setIsMobileSearchOpen: (isOpen: boolean) => void;
  resetSearch: () => void;
}


export const useHomeStore = create<HomeStore>((set) => ({
  // Initial state
  category: "halls",
  location: "",
  dateRange: undefined,
  capacity: undefined,
  role: undefined,
  isMobileSearchOpen: false,

  // Actions
  setCategory: (category) => set({ category }),
  setLocation: (location) => set({ location }),
  setDateRange: (dateRange) => set({ dateRange }),
  setCapacity: (capacity) => set({ capacity }),
  setRole: (role) => set({ role }),
  setIsMobileSearchOpen: (isMobileSearchOpen) => set({ isMobileSearchOpen }),

  // Reset to initial state
  resetSearch: () =>
    set({
      category: "halls",
      location: "",
      dateRange: undefined,
      capacity: undefined,
      role: undefined,
      isMobileSearchOpen: false,
    }),
}));

"use client";

import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { searchSchema, type SearchFormData } from "../utils/searchSchema";

/**
 * Initialize react-hook-form with Zod validation.
 *
 * Uses schema defaults, not Zustand (decoupled for clarity).
 * 
 * On Home: Form is the source of truth. Just initialize with defaults.
 * On Listings: Not used. Store is hydrated from URL separately.
 */
export function useSearchForm(): UseFormReturn<SearchFormData> {
  return useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    mode: "onChange",
    defaultValues: {
      category: "halls",
      location: "",
      dateRange: undefined,
      capacity: undefined,
      role: undefined,
    },
  });
}
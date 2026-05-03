"use client";

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { searchSchema, type SearchFormData } from "../utils/searchSchema";
import { useHomeStore } from "../store/homeStore";

/**
 * Initialize react-hook-form with Zod validation.
 *
 * Default values are pulled from Zustand store, allowing form
 * to resume with previous selections if user returns to home.
 *
 * This hook ONLY manages form validation, not state.
 * State updates go to both react-hook-form and Zustand.
 */
export function useSearchForm(): UseFormReturn<SearchFormData> {
  const { category, location, dateRange } = useHomeStore();

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    mode: "onChange",
    defaultValues: {
      category,
      location,
      dateRange,
    },
  });

  return form;
}

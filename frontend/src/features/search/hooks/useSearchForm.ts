"use client";

import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { searchSchema, SEARCH_FORM_DEFAULTS, type SearchFormData } from "../utils/searchSchema";
import { loadLastSearch } from "../lib/lastSearch";

/**
 * Form owns search state. SSR-safe defaults on the first render (identical
 * server/client markup), then `reset` restores the user's last search after
 * mount. RHF's `reset` is not a React setState, so this passes
 * react-hooks/set-state-in-effect while still syncing from the external
 * localStorage "store".
 */
export function useSearchForm(): UseFormReturn<SearchFormData> {
  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    mode: "onChange",
    defaultValues: SEARCH_FORM_DEFAULTS,
  });

  useEffect(() => {
    const ls = loadLastSearch();
    if (!ls) return;
    form.reset({
      category: ls.category,
      location: ls.location ?? "",
      coverageArea: ls.coverageArea ?? "",
      dateRange: ls.dateRange
        ? {
            from: new Date(ls.dateRange.from),
            to: ls.dateRange.to ? new Date(ls.dateRange.to) : undefined,
          }
        : undefined,
      capacity: ls.capacity,
      role: ls.role,
      flexible: ls.flexible ?? 0,
    });
  }, [form]);

  return form;
}
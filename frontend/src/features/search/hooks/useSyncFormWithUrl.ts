"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";

import { parseSearchParams } from "../utils/searchParamsConverter";
import { saveLastSearch } from "../lib/lastSearch";
import type { SearchFormInput, SearchFormData } from "../utils/searchSchema";

/**
 * On the /listings pages the URL is the source of truth. This hook keeps the
 * hero search bar (and everything derived from the form, mobile summary,
 * RoleDropdown, etc.) in sync with the URL, including after a hard refresh,
 * and mirrors the committed search into localStorage so the homepage hero
 * shows the same thing.
 *
 * Runs AFTER useSearchForm's own localStorage-restore effect (hooks fire in
 * call order), so URL values always win.
 */
export function useSyncFormWithUrl(
  form: UseFormReturn<SearchFormInput, any, SearchFormData>
) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });

    // Bare /listings with no params: keep whatever the last-search restore
    // gave the form (nice continuity), don't wipe it.
    if (Object.keys(raw).length === 0) return;

    const parsed = parseSearchParams(raw);

    form.reset({
      category: parsed.category ?? "halls",
      location: parsed.location ?? "",
      coverageArea: parsed.coverageArea ?? "",
      dateRange: parsed.dateRange,
      capacity: parsed.capacity,
      role: parsed.role,
      flexible: parsed.flexible ?? 0,
    });

    saveLastSearch({
      category: parsed.category ?? "halls",
      location: parsed.location ?? "",
      coverageArea: parsed.coverageArea ?? "",
      dateRange: parsed.dateRange,
      capacity: parsed.capacity,
      role: parsed.role,
      flexible: parsed.flexible ?? 0,
    });
  }, [searchParams, form]);
}
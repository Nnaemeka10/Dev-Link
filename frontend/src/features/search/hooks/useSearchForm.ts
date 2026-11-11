"use client";

import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  searchSchema,
  SEARCH_FORM_DEFAULTS,
  type SearchFormData,
  type SearchFormInput,
} from "../utils/searchSchema";
import { loadLastSearch } from "../lib/lastSearch";

/**
 * Three generics: <form-state type, context, submit-data type>.
 * The first MUST be the schema's INPUT type to match zodResolver;
 * the third is the parsed OUTPUT your onSubmit callbacks receive.
 */
export function useSearchForm(): UseFormReturn<SearchFormInput, any, SearchFormData> {
  const form = useForm<SearchFormInput, any, SearchFormData>({
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
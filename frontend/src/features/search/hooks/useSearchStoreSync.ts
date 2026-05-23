import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { SearchFormData } from "../utils/searchSchema";

/**
 * DEPRECATED: This hook is no longer needed.
 *
 * Context:
 * - Form state lives on home page (react-hook-form)
 * - Search params come from URL on listings page (next/navigation)
 * - Zustand store is ONLY for mobile UI state
 *
 * Migration:
 * - Remove this hook from HeroSection
 * - Form data is passed directly to search submission handler
 * - No bidirectional sync needed
 */
export function useSearchStoreSync(form: UseFormReturn<SearchFormData>) {
  // No-op: Store is only for UI state, form owns search params
  // This is kept for backward compatibility during migration
}

// Store
export { useSearchStore } from "./store/useSearchStore";
export type { SearchStore } from "./store/useSearchStore";

// Types
export type { SearchState, SearchCategory, DateRange } from "./types/search.types";

// Utils & Schemas
export { searchSchema, dateRangeSchema } from "./utils/searchSchema";
export { parseSearchParams, buildSearchString, buildSearchParams, buildListingsUrl } from "./utils/searchParamsConverter";

// Hooks
export { useSearchForm } from "./hooks/useSearchForm";
export { useSearchUrlSync } from "./hooks/useSearchUrlSync";

// Lib
export { SERVICE_CATEGORIES } from "./lib/constants";

// Components
export { default as DesktopSearchBar } from "./components/DesktopSearchBar";
export { default as MobileSearchModal } from "./components/MobileSearchModal";
export { default as MobileSearchTrigger } from "./components/MobileSearchTrigger";
export { CapacityDropdown } from "./components/CapacityDropdown";
export { RoleDropdown } from "./components/RoleDropdown";
export { DateRangePicker } from "./components/DateRange";

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
export { useScrollCollapse } from "./hooks/useScrollCollapse";

// Lib
export { SERVICE_CATEGORIES, SEARCH_TABS, POPULAR_STATES, FLEX_OPTIONS } from "./lib/constants";
export { saveLastSearch, loadLastSearch } from "./lib/lastSearch";

// Components
export { default as DesktopSearchBar } from "./components/DesktopSearchBar";
export { default as MobileSearchModal } from "./components/MobileSearchModal";
export { default as MobileSearchTrigger } from "./components/MobileSearchTrigger";
export { default as CollapsedSearchPill } from "./components/CollapsedSearchPill";
export { default as WhereCombobox } from "./components/WhereCombobox";
export { CapacityDropdown } from "./components/CapacityDropdown";
export { RoleDropdown } from "./components/RoleDropdown";
export { DateRangePicker, formatTriggerLabel } from "./components/DateRange";
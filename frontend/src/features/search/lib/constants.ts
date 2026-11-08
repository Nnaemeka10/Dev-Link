export const SERVICE_CATEGORIES = [
  { id: "dj", label: "DJ" },
  { id: "mc", label: "MC" },
  { id: "photographer", label: "Photographer" },
  { id: "videographer", label: "Videographer" },
  { id: "event-planner", label: "Event Planner" },
  { id: "makeup-artist", label: "Make-up Artist" },
  { id: "ushers", label: "Ushers" },
  { id: "security", label: "Security" },
  { id: "car-rental", label: "Car Rental" },
  { id: "hall-decorator", label: "Hall Decorator" },
  { id: "culinary", label: "Catering" },
] as const;

export const SEARCH_TABS = [
  { id: "halls", label: "Event Halls" },
  { id: "services", label: "Services" },
] as const;

/** Shown on empty focus in the Where combobox. names must
 * match `states` table for backend resolution. */
export const POPULAR_STATES = [
  "Lagos",
  "FCT",
  "Rivers",
  "Oyo",
  "Enugu",
  "Kaduna",
  "Delta",
  "Anambra",
] as const;

export const FLEX_OPTIONS = [
  { value: 0, label: "Exact dates" },
  { value: 1, label: "± 1 day" },
  { value: 2, label: "± 2 days" },
] as const;

export type FlexValue = (typeof FLEX_OPTIONS)[number]["value"];
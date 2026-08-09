export type ListingSearchCategory = "halls" | "services";
export type SortBy = "recommended" | "price" | "rating";
export type SortOrder = "asc" | "desc";

export interface ListingSearchParams {
  category: ListingSearchCategory;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  capacity?: number;
  role?: string;
  sort?: SortBy;
  sortOrder?: SortOrder;
  priceMin?: number;
  priceMax?: number;
  capacityMin?: number;
  capacityMax?: number;
  minRating?: number;
  verified?: boolean;
  venueTypes?: string[];
  amenities?: string[];
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function takeFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeText(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const normalized = value.replace(/[<>"'`]/g, "").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function sanitizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function sanitizeNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const num = parseInt(value, 10);
  return !Number.isNaN(num) && num >= 1 ? num : undefined;
}

function sanitizeSort(value: string | undefined): SortBy | undefined {
  if (value === "price" || value === "rating" || value === "recommended") {
    return value;
  }
  return undefined;
}

function sanitizeSortOrder(value: string | undefined): SortOrder | undefined {
  return value === "desc" ? "desc" : value === "asc" ? "asc" : undefined;
}

export function normalizeListingSearchParams(raw: RawSearchParams): ListingSearchParams {
  const category = takeFirst(raw.category) === "services" ? "services" : "halls";
  const venueTypes = takeFirst(raw.venueTypes);
  const amenities = takeFirst(raw.amenities);

  return {
    category,
    location: sanitizeText(takeFirst(raw.location)),
    dateFrom: sanitizeDate(takeFirst(raw.dateFrom)),
    dateTo: sanitizeDate(takeFirst(raw.dateTo)),
    capacity: category === "halls" ? sanitizeNumber(takeFirst(raw.capacity)) : undefined,
    role: category === "services" ? sanitizeText(takeFirst(raw.role)) : undefined,
    sort: sanitizeSort(takeFirst(raw.sort)),
    sortOrder: sanitizeSortOrder(takeFirst(raw.sortOrder)),
    priceMin: sanitizeNumber(takeFirst(raw.priceMin)),
    priceMax: sanitizeNumber(takeFirst(raw.priceMax)),
    capacityMin: sanitizeNumber(takeFirst(raw.capacityMin)),
    capacityMax: sanitizeNumber(takeFirst(raw.capacityMax)),
    minRating: sanitizeNumber(takeFirst(raw.minRating)),
    verified: takeFirst(raw.verified) === "true",
    venueTypes: venueTypes ? venueTypes.split(",").filter(Boolean) : undefined,
    amenities: amenities ? amenities.split(",").filter(Boolean) : undefined,
  };
}


export function buildListingsHref(params: ListingSearchParams): string {
  const search = new URLSearchParams({ category: params.category });

  if (params.location) search.set("location", params.location);
  if (params.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params.dateTo) search.set("dateTo", params.dateTo);
  if (params.capacity !== undefined) search.set("capacity", params.capacity.toString());
  if (params.role) search.set("role", params.role);
  if (params.sort) search.set("sort", params.sort);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);

  if (params.priceMin !== undefined) search.set("priceMin", params.priceMin.toString());
  if (params.priceMax !== undefined) search.set("priceMax", params.priceMax.toString());
  if (params.capacityMin !== undefined) search.set("capacityMin", params.capacityMin.toString());
  if (params.capacityMax !== undefined && params.capacityMax > 0) search.set("capacityMax", params.capacityMax.toString());
  if (params.minRating !== undefined) search.set("minRating", params.minRating.toString());
  if (params.verified) search.set("verified", "true");
  if (params.venueTypes && params.venueTypes.length > 0) search.set("venueTypes", params.venueTypes.join(","));
  if (params.amenities && params.amenities.length > 0) search.set("amenities", params.amenities.join(","));

  return `/listings?${search.toString()}`;
}

export function getListingCategoryLabel(category: ListingSearchCategory): string {
  return category === "halls" ? "Event Halls" : "Services";
}

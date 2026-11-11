export type ListingSearchCategory = "halls" | "services";

/** Every ordering the backend keyset supports. "recommended" resolves to rating. */
export type SortBy = "recommended" | "price" | "rating" | "reviews" | "newest";
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
  coverage?: string;
  flexible?: number;
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

/** Ratings are fractional (3.5 / 4.5 / 4.8) — parseInt would floor them to 3 / 4. */
function sanitizeRating(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && num <= 5 ? num : undefined;
}

function sanitizeSort(value: string | undefined): SortBy | undefined {
  const v = value?.trim();
  if (v === "price" || v === "rating" || v === "reviews" || v === "newest" || v === "recommended") {
    return v;
  }
  return undefined;
}

function sanitizeSortOrder(value: string | undefined): SortOrder | undefined {
  const v = value?.trim().toLowerCase();
  return v === "desc" ? "desc" : v === "asc" ? "asc" : undefined;
}

function sanitizeFlexible(value: string | undefined): number | undefined {
  const num = parseInt(value ?? "0", 10);
  return [1, 2].includes(num) ? num : undefined;
}

/** Ids arrive comma-joined; trim every token so it matches the DB exactly. */
function sanitizeList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const tokens = value.split(",").map((token) => token.trim()).filter(Boolean);
  return tokens.length > 0 ? tokens : undefined;
}

/**
 * The URL is the single source of truth for a search. Sort, sortOrder and every
 * filter live here; the cursor deliberately does NOT. Any change to this URL
 * produces a new React Query key, which discards all loaded pages and refetches
 * page one and a cursor minted under one sort/filter set can never be replayed
 * under another.
 *
 * Category gating mirrors what the publish flow actually writes: amenities,
 * venue types and capacity exist only on halls (services get listing_features
 * cleared and capacity = NULL), so carrying them onto the services tab would
 * guarantee zero results.
 */
export function normalizeListingSearchParams(raw: RawSearchParams): ListingSearchParams {
  const category = takeFirst(raw.category) === "services" ? "services" : "halls";
  const isHalls = category === "halls";

  return {
    category,
    location: isHalls ? sanitizeText(takeFirst(raw.location)) : undefined,
    dateFrom: sanitizeDate(takeFirst(raw.dateFrom)),
    dateTo: sanitizeDate(takeFirst(raw.dateTo)),
    capacity: isHalls ? sanitizeNumber(takeFirst(raw.capacity)) : undefined,
    role: isHalls ? undefined : sanitizeText(takeFirst(raw.role)),
    sort: sanitizeSort(takeFirst(raw.sort)),
    sortOrder: sanitizeSortOrder(takeFirst(raw.sortOrder)),
    priceMin: sanitizeNumber(takeFirst(raw.priceMin)),
    priceMax: sanitizeNumber(takeFirst(raw.priceMax)),
    capacityMin: isHalls ? sanitizeNumber(takeFirst(raw.capacityMin)) : undefined,
    capacityMax: isHalls ? sanitizeNumber(takeFirst(raw.capacityMax)) : undefined,
    minRating: sanitizeRating(takeFirst(raw.minRating)),
    verified: takeFirst(raw.verified) === "true",
    venueTypes: isHalls ? sanitizeList(takeFirst(raw.venueTypes)) : undefined,
    amenities: isHalls ? sanitizeList(takeFirst(raw.amenities)) : undefined,
    coverage: isHalls ? undefined : sanitizeText(takeFirst(raw.coverage)),
    flexible: sanitizeFlexible(takeFirst(raw.flexible)),
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
  if (params.venueTypes?.length) search.set("venueTypes", params.venueTypes.join(","));
  if (params.amenities?.length) search.set("amenities", params.amenities.join(","));
  if (params.coverage) search.set("coverage", params.coverage);
  if (params.flexible) search.set("flexible", params.flexible.toString());
  return `/listings?${search.toString()}`;
}

export function getListingCategoryLabel(category: ListingSearchCategory): string {
  return category === "halls" ? "Event Halls" : "Services";
}
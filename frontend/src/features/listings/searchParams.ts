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

function sanitizeCapacity(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const num = parseInt(value, 10);
  return !Number.isNaN(num) && num >= 1 ? num : undefined;
}

function sanitizeSort(value: string | undefined): SortBy | undefined {
  return value === "price" || value === "rating" ? value : undefined;
}

function sanitizeSortOrder(value: string | undefined): SortOrder | undefined {
  return value === "desc" ? "desc" : value === "asc" ? "asc" : undefined;
}

export function normalizeListingSearchParams(raw: RawSearchParams): ListingSearchParams {
  const category = takeFirst(raw.category) === "services" ? "services" : "halls";

  return {
    category,
    location: sanitizeText(takeFirst(raw.location)),
    dateFrom: sanitizeDate(takeFirst(raw.dateFrom)),
    dateTo: sanitizeDate(takeFirst(raw.dateTo)),
    capacity: category === "halls" ? sanitizeCapacity(takeFirst(raw.capacity)) : undefined,
    role: category === "services" ? sanitizeText(takeFirst(raw.role)) : undefined,
    sort: sanitizeSort(takeFirst(raw.sort)),
    sortOrder: sanitizeSortOrder(takeFirst(raw.sortOrder)),
  };
}

export function buildListingsHref(params: ListingSearchParams): string {
  const search = new URLSearchParams({ category: params.category });

  if (params.location) {
    search.set("location", params.location);
  }

  if (params.dateFrom) {
    search.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    search.set("dateTo", params.dateTo);
  }

  if (params.capacity !== undefined) {
    search.set("capacity", params.capacity.toString());
  }

  if (params.role) {
    search.set("role", params.role);
  }

  if (params.sort) {
    search.set("sort", params.sort);
  }

  if (params.sortOrder) {
    search.set("sortOrder", params.sortOrder);
  }

  return `/listings?${search.toString()}`;
}

export function getListingCategoryLabel(category: ListingSearchCategory): string {
  return category === "halls" ? "Event Halls" : "Services";
}

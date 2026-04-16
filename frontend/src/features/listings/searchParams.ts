export type ListingSearchCategory = "halls" | "services";

export interface ListingSearchParams {
  category: ListingSearchCategory;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
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

export function normalizeListingSearchParams(raw: RawSearchParams): ListingSearchParams {
  const category = takeFirst(raw.category) === "services" ? "services" : "halls";

  return {
    category,
    location: sanitizeText(takeFirst(raw.location)),
    dateFrom: sanitizeDate(takeFirst(raw.dateFrom)),
    dateTo: sanitizeDate(takeFirst(raw.dateTo)),
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

  return `/listings?${search.toString()}`;
}

export function getListingCategoryLabel(category: ListingSearchCategory): string {
  return category === "halls" ? "Event Halls" : "Services";
}

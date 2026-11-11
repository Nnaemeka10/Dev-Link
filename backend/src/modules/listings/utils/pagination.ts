import type {
  CursorPaginatedResponse,
  ListingCursorPayload,
  ListingKind,
  ListingRow,
  ListingSearchQuery,
  ListingSort,
  SortDirection,
} from '../types/listing.js';
import { toNumber } from './listingMapper.js';

/**
 * 12 rows divides evenly into the 2-column (tablet) and 3-column (desktop)
 * explore grids, keeps a keyset page + its lateral joins in single-digit
 * milliseconds on the migration-027 indexes, and pairs with the client's
 * 800px prefetch margin so the next page arrives before the fold.
 * Mirrors EXPLORE_PAGE_SIZE on the frontend.
 */
export const LISTINGS_PAGE_SIZE = 12;
export const HOME_PAGE_SIZE = 12;
export const TRENDING_LIMIT = 3;

const MAX_PAGE_SIZE = 50;

export function parseLimit(value: unknown, fallback: number, max = MAX_PAGE_SIZE): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export function parseListingKind(value: string | undefined): ListingKind | undefined {
  const v = value?.trim();
  if (v === 'hall' || v === 'halls') return 'hall';
  if (v === 'service' || v === 'services') return 'service';
  return undefined;
}

export function parseListingSort(value: string | undefined): ListingSort {
  const v = value?.trim();
  if (v === 'price' || v === 'reviews' || v === 'newest') return v;
  // 'recommended' and anything unrecognised resolve to the rating keyset.
  return 'rating';
}

export function parseSortDirection(value: string | undefined): SortDirection {
  return value?.trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
}

function tokens(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const list = value.split(',').map((t) => t.trim()).filter(Boolean);
  return list.length ? list : undefined;
}

export function parseSearchQuery(query: ListingSearchQuery) {
  const capacity = Number(query.capacity);
  const capacityMin = Number(query.capacityMin);
  const capacityMax = Number(query.capacityMax);
  const priceMin = Number(query.priceMin);
  const priceMax = Number(query.priceMax);
  const minRating = Number(query.minRating);
  const flexible = Number(query.flexible);

  return {
    kind: parseListingKind(query.kind ?? query.category),
    location: query.location?.trim() || undefined,
    searchTerm: (query.q ?? query.query)?.trim() || undefined,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : undefined,
    capacityMin: Number.isFinite(capacityMin) && capacityMin > 0 ? capacityMin : undefined,
    capacityMax: Number.isFinite(capacityMax) && capacityMax > 0 ? capacityMax : undefined,
    priceMin: Number.isFinite(priceMin) && priceMin > 0 ? Math.round(priceMin * 100) : undefined,
    priceMax: Number.isFinite(priceMax) && priceMax > 0 ? Math.round(priceMax * 100) : undefined,
    minRating: Number.isFinite(minRating) && minRating > 0 ? minRating : undefined,
    verified: query.verified?.trim() === 'true',
    venueTypes: tokens(query.venueTypes),
    amenities: tokens(query.amenities),
    role: query.role?.trim() || undefined,
    coverage: query.coverage?.trim() || undefined,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    flexible: [1, 2].includes(flexible) ? flexible : 0,
  };
}

export function encodeCursor(payload: ListingCursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Cursors are untrusted client input AND sort-specific: `sort=rating` mints
 * {rating, reviewCount, createdAt, id}, `sort=price` needs priceFrom, and so
 * on. Replaying one ordering's cursor under another would either bind an
 * undefined parameter (500) or silently skip/duplicate rows.
 *
 * When `sort` is supplied, a cursor missing that ordering's fields decodes to
 * null, a clean restart at page one. The frontend already prevents this by
 * keeping sort in the query key; this keeps the API safe for any caller,
 * including a request racing a sort switch.
 */
export function decodeCursor(
  cursor: string | undefined,
  sort?: ListingSort,
): ListingCursorPayload | null {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as ListingCursorPayload | null;

    if (!decoded || typeof decoded !== 'object') return null;
    if (typeof decoded.id !== 'string' || decoded.id.length === 0) return null;

    // Every ordering ends with the created_at/id tie-breaker.
    if (typeof decoded.createdAt !== 'string' || Number.isNaN(Date.parse(decoded.createdAt))) {
      return null;
    }

    for (const key of ['rating', 'reviewCount', 'priceFrom', 'rankScore'] as const) {
      const value = decoded[key];
      if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
        return null;
      }
    }

    if (sort === 'price' && decoded.priceFrom === undefined) return null;
    if (sort === 'reviews' && decoded.reviewCount === undefined) return null;
    if ((sort === 'rating' || sort === 'trending') && decoded.rating === undefined) return null;

    return decoded;
  } catch {
    return null;
  }
}

export function buildCursorFromRow(row: ListingRow, sort: ListingSort): ListingCursorPayload {
  const base = {
    id: row.id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };

  switch (sort) {
    case 'price':
      return { ...base, priceFrom: toNumber(row.base_price_kobo), rating: toNumber(row.average_rating) };
    case 'reviews':
      return { ...base, reviewCount: Number(row.review_count ?? 0), rating: toNumber(row.average_rating) };
    case 'newest':
      return base;
    case 'rating':
    case 'trending':
    default:
      return { ...base, rating: toNumber(row.average_rating), reviewCount: Number(row.review_count ?? 0) };
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  nextCursor: string | null,
  limit: number,
): CursorPaginatedResponse<T> {
  return { data, pagination: { limit, hasMore: Boolean(nextCursor), nextCursor } };
}


export function getNextCursor(rows: ListingRow[], limit: number, sort: ListingSort): string | null {
  if (rows.length <= limit) return null;
  return encodeCursor(buildCursorFromRow(rows[limit - 1], sort));
}

export function trimPaginationRows<T>(rows: T[], limit: number): T[] {
  return rows.slice(0, limit);
}
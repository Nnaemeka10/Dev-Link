import { toNumber } from './listingMapper.js';
export const LISTINGS_PAGE_SIZE = 24;
export const HOME_PAGE_SIZE = 12;
export const TRENDING_LIMIT = 3;
const MAX_PAGE_SIZE = 50;
export function parseLimit(value, fallback, max = MAX_PAGE_SIZE) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.min(parsed, max);
}
export function parseListingKind(value) {
    if (value === 'hall' || value === 'halls')
        return 'hall';
    if (value === 'service' || value === 'services')
        return 'service';
    return undefined;
}
export function parseListingSort(value) {
    if (value === 'price' || value === 'reviews' || value === 'newest') {
        return value;
    }
    return 'rating';
}
export function parseSortDirection(value) {
    return value?.toLowerCase() === 'asc' ? 'asc' : 'desc';
}
export function parseSearchQuery(query) {
    const capacity = Number(query.capacity);
    return {
        kind: parseListingKind(query.kind ?? query.category),
        location: query.location?.trim() || undefined,
        searchTerm: (query.q ?? query.query)?.trim() || undefined,
        capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : undefined,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
    };
}
export function encodeCursor(payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
}
export function decodeCursor(cursor) {
    if (!cursor)
        return null;
    try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
        if (!decoded.id)
            return null;
        return decoded;
    }
    catch {
        return null;
    }
}
export function buildCursorFromRow(row, sort) {
    const base = {
        id: row.id,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    };
    switch (sort) {
        case 'price':
            return {
                ...base,
                priceFrom: toNumber(row.base_price),
                rating: toNumber(row.average_rating),
            };
        case 'reviews':
            return {
                ...base,
                reviewCount: Number(row.review_count ?? 0),
                rating: toNumber(row.average_rating),
            };
        case 'newest':
            return base;
        case 'rating':
        case 'trending':
        default:
            return {
                ...base,
                rating: toNumber(row.average_rating),
                reviewCount: Number(row.review_count ?? 0),
            };
    }
}
export function createPaginatedResponse(data, nextCursor, limit) {
    return {
        data,
        pagination: {
            limit,
            hasMore: Boolean(nextCursor),
            nextCursor,
        },
    };
}
export function getNextCursor(rows, limit, sort) {
    if (rows.length <= limit)
        return null;
    return encodeCursor(buildCursorFromRow(rows[limit - 1], sort));
}
export function trimPaginationRows(rows, limit) {
    return rows.slice(0, limit);
}
//# sourceMappingURL=pagination.js.map
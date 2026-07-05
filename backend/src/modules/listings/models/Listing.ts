import { getDB } from '../../../lib/db.js';
import type {
    ListingCursorPayload,
    ListingKind,
    ListingPageOptions,
    ListingRow,
    ListingSort,
    RankingMode,
    SortDirection,
} from '../types/listing.js';

//do this later
// ALTER TABLE listings ALTER COLUMN average_rating SET DEFAULT 0;
// UPDATE listings SET average_rating = 0 WHERE average_rating IS NULL;

const PUBLIC_LISTING_CLAUSES = [
    `l.status = 'published'`,
    `l.deleted_at IS NULL`,
];

type QueryParts = {
    clauses: string[];
    values: unknown[];
};

function escapeILike(str: string): string {
    return str.replace(/[%_\\]/g, '\\$&');
}



function addValue(values: unknown[], value: unknown): string {
    values.push(value);
    return `$${values.length}`;
}

function buildListingsSelect(): string {
    return `
        SELECT
            l.id,
            l.title,
            l.headline,
            l.kind,
            l.description,
            l.base_price,
            l.price_unit,
            l.address_line,
            l.city,
            l.state,
            l.country,
            l.latitude,
            l.longitude,
            l.average_rating,
            l.review_count,
            l.capacity,
            l.available_from,
            l.available_to,
            l.auto_approve,
            l.created_at,
            0 AS booking_count,
            COALESCE(asset_data.assets, '[]'::json) AS assets,
            COALESCE(badge_data.badges, '[]'::json) AS badges
        FROM listings l
        LEFT JOIN LATERAL (
            SELECT json_agg(
                json_build_object(
                    'id', la.id,
                    'url', la.url,
                    'type', la.type,
                    'isPrimary', la.is_primary,
                    'sortOrder', la.sort_order
                )
                ORDER BY la.is_primary DESC, la.sort_order ASC, la.created_at ASC
            ) AS assets
            FROM listing_assets la
            WHERE la.listing_id = l.id
        ) asset_data ON TRUE
        LEFT JOIN LATERAL (
            SELECT json_agg(
                json_build_object(
                    'id', bd.id,
                    'name', bd.name,
                    'iconUrl', bd.icon_url
                )
                ORDER BY bd.name ASC
            ) AS badges
            FROM listing_badges lb
            JOIN badge_dictionary bd ON bd.id = lb.badge_id
            WHERE lb.listing_id = l.id
        ) badge_data ON TRUE
    `;
}

function buildFilterParts(options: ListingPageOptions): QueryParts {
    const values: unknown[] = [];
    const clauses = [...PUBLIC_LISTING_CLAUSES];
    const { filters } = options;

    if (filters.kind) {
        clauses.push(`l.kind = ${addValue(values, filters.kind)}`);
    }

    if (filters.excludeId) {
        clauses.push(`l.id != ${addValue(values, filters.excludeId)}`);
    }

    if (filters.location) {
        clauses.push(`CONCAT_WS(' ', l.address_line, l.city, l.state, l.country) ILIKE ${addValue(values, `%${filters.location}%`)}`);
    }

    if (filters.searchTerm) {
        const escapedTerm = escapeILike(filters.searchTerm);
        clauses.push(`CONCAT_WS(' ', l.title, l.headline, l.description, l.city, l.state) ILIKE ${addValue(values, `%${escapedTerm}%`)}`);
    }

    if (filters.capacity) {
        clauses.push(`(l.capacity IS NULL OR l.capacity >= ${addValue(values, filters.capacity)})`);
    }

    if (filters.dateFrom && filters.dateTo) {
        const dateFrom = addValue(values, filters.dateFrom);
        const dateTo = addValue(values, filters.dateTo);
        clauses.push(`
            NOT EXISTS (
                SELECT 1
                FROM listing_unavailable_dates lud
                WHERE lud.listing_id = l.id
                    AND lud.start_date <= ${dateTo}::date
                    AND lud.end_date >= ${dateFrom}::date
            )
        `);
    }

    addCursorClause(clauses, values, options.cursor, options.sort, options.sortDirection);

    return { clauses, values };
}

function comparisonFor(direction: SortDirection): '>' | '<' {
    return direction === 'asc' ? '>' : '<';
}

function addCursorClause(
    clauses: string[],
    values: unknown[],
    cursor: ListingCursorPayload | null,
    sort: ListingSort,
    sortDirection: SortDirection,
) {
    if (!cursor) return;

    const id = addValue(values, cursor.id);
    const createdAt = addValue(values, cursor.createdAt);

    if (sort === 'price' && cursor.priceFrom === undefined) {
        throw new Error('Invalid cursor for price sort');
    }

    if (sort === 'price') {
        const price = addValue(values, cursor.priceFrom ?? 0);
        const rating = addValue(values, cursor.rating ?? 0);
        const primaryOperator = comparisonFor(sortDirection);

        clauses.push(`
            (
                l.base_price ${primaryOperator} ${price}
                OR (l.base_price = ${price} AND l.average_rating < ${rating})
                OR (l.base_price = ${price} AND l.average_rating = ${rating} AND l.created_at < ${createdAt}::timestamptz)
                OR (l.base_price = ${price} AND l.average_rating = ${rating} AND l.created_at = ${createdAt}::timestamptz AND l.id < ${id}::uuid)
            )
        `);
        return;
    }

    if (sort === 'reviews') {
        const reviewCount = addValue(values, cursor.reviewCount ?? 0);
        const rating = addValue(values, cursor.rating ?? 0);
        const primaryOperator = comparisonFor(sortDirection);

        clauses.push(`
            (
                l.review_count ${primaryOperator} ${reviewCount}
                OR (l.review_count = ${reviewCount} AND l.average_rating < ${rating})
                OR (l.review_count = ${reviewCount} AND l.average_rating = ${rating} AND l.created_at < ${createdAt}::timestamptz)
                OR (l.review_count = ${reviewCount} AND l.average_rating = ${rating} AND l.created_at = ${createdAt}::timestamptz AND l.id < ${id}::uuid)
            )
        `);
        return;
    }

    if (sort === 'newest') {
        const primaryOperator = comparisonFor(sortDirection);

        clauses.push(`
            (
                l.created_at ${primaryOperator} ${createdAt}::timestamptz
                OR (l.created_at = ${createdAt}::timestamptz AND l.id ${primaryOperator} ${id}::uuid)
            )
        `);
        return;
    }

    const rating = addValue(values, cursor.rating ?? 0);
    const reviewCount = addValue(values, cursor.reviewCount ?? 0);
    const primaryOperator = comparisonFor(sortDirection);

    clauses.push(`
        (
            l.average_rating ${primaryOperator} ${rating}
            OR (l.average_rating = ${rating} AND l.review_count ${primaryOperator} ${reviewCount})
            OR (l.average_rating = ${rating} AND l.review_count = ${reviewCount} AND l.created_at < ${createdAt}::timestamptz)
            OR (l.average_rating = ${rating} AND l.review_count = ${reviewCount} AND l.created_at = ${createdAt}::timestamptz AND l.id < ${id}::uuid)
        )
    `);
}

function buildOrderBy(sort: ListingSort, direction: SortDirection): string {
    const sqlDirection = direction.toUpperCase();

    switch (sort) {
        case 'price':
            return `ORDER BY l.base_price ${sqlDirection}, l.average_rating DESC, l.created_at DESC, l.id DESC`;
        case 'reviews':
            return `ORDER BY l.review_count ${sqlDirection}, l.average_rating DESC, l.created_at DESC, l.id DESC`;
        case 'newest':
            return `ORDER BY l.created_at ${sqlDirection}, l.id ${sqlDirection}`;
        case 'trending':
        case 'rating':
        default:
            return `ORDER BY l.average_rating ${sqlDirection}, l.review_count ${sqlDirection}, l.created_at DESC, l.id DESC`;
    }
}

export const ListingModel = {
    async findPage(options: ListingPageOptions): Promise<ListingRow[]> {
        const db = getDB();
        const { clauses, values } = buildFilterParts(options);
        const limit = addValue(values, options.limit + 1);
        const query = `
            ${buildListingsSelect()}
            WHERE ${clauses.join(' AND ')}
            ${buildOrderBy(options.sort, options.sortDirection)}
            LIMIT ${limit}
        `;
        const result = await db.query<ListingRow>(query, values);

        return result.rows;
    },

        async findById(id: string): Promise<ListingRow | null> {
        const db = getDB();
        const result = await db.query<ListingRow>(
            `
                WITH listing_details AS (
                    SELECT 
                        l.id, l.title, l.headline, l.kind, l.description,
                        l.base_price, l.price_unit, l.address_line, l.city, l.state, l.country,
                        l.latitude, l.longitude, l.average_rating, l.review_count, l.capacity,
                        l.available_from, l.available_to, l.auto_approve, l.created_at,
                        l.service_metadata,
                        COALESCE(asset_data.assets, '[]'::json) AS assets,
                        COALESCE(badge_data.badges, '[]'::json) AS badges,
                        COALESCE(package_data.packages, '[]'::json) AS packages,
                        COALESCE(feature_data.features, '[]'::json) AS features,
                        COALESCE(review_data.reviews, '[]'::json) AS reviews,
                        COALESCE(area_data.areas, '[]'::json) AS service_areas
                    FROM listings l
                    LEFT JOIN LATERAL (
                        SELECT json_agg(
                            json_build_object(
                                'id', la.id, 'url', la.url, 'type', la.type,
                                'isPrimary', la.is_primary, 'sortOrder', la.sort_order
                            ) ORDER BY la.is_primary DESC, la.sort_order ASC, la.created_at ASC
                        ) AS assets
                        FROM listing_assets la WHERE la.listing_id = l.id
                    ) asset_data ON TRUE
                    LEFT JOIN LATERAL (
                        SELECT json_agg(
                            json_build_object('id', bd.id, 'name', bd.name, 'iconUrl', bd.icon_url)
                            ORDER BY bd.name ASC
                        ) AS badges
                        FROM listing_badges lb
                        JOIN badge_dictionary bd ON bd.id = lb.badge_id
                        WHERE lb.listing_id = l.id
                    ) badge_data ON TRUE
                    LEFT JOIN LATERAL (
                        SELECT json_agg(
                            json_build_object(
                                'id', sp.id,
                                'name', sp.name,
                                'price', sp.price,
                                'description', sp.description,
                                'isPopular', sp.is_popular,
                                'sortOrder', sp.sort_order,
                                'features', (
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', pf.id,
                                            'text', pf.text,
                                            'sortOrder', pf.sort_order
                                        ) ORDER BY pf.sort_order ASC
                                    )
                                    FROM package_features pf WHERE pf.package_id = sp.id
                                )
                            )
                            ORDER BY sp.sort_order ASC
                        ) AS packages
                        FROM service_packages sp WHERE sp.listing_id = l.id
                    ) package_data ON TRUE
                    LEFT JOIN LATERAL (
                        SELECT json_agg(
                            json_build_object(
                                'id', lf.id,
                                'icon', lf.icon,
                                'label', lf.label,
                                'value', lf.value
                            ) ORDER BY lf.sort_order ASC
                        ) AS features
                        FROM listing_features lf WHERE lf.listing_id = l.id
                    ) feature_data ON TRUE
                    LEFT JOIN LATERAL (
                        SELECT json_agg(
                            json_build_object(
                                'id', lr.id,
                                'userId', lr.user_id,
                                'rating', lr.rating,
                                'body', lr.body,
                                'createdAt', lr.created_at
                            ) ORDER BY lr.created_at DESC
                        ) AS reviews
                        FROM listing_reviews lr WHERE lr.listing_id = l.id
                    ) review_data ON TRUE
                    LEFT JOIN LATERAL (
                        SELECT json_agg(
                            json_build_object(
                                'city', lsa.city,
                                'state', lsa.state,
                                'country', lsa.country
                            ) ORDER BY lsa.city ASC
                        ) AS areas
                        FROM listing_service_areas lsa WHERE lsa.listing_id = l.id
                    ) area_data ON TRUE
                    WHERE ${PUBLIC_LISTING_CLAUSES.join(' AND ')} AND l.id = $1
                )
                SELECT 
                    ld.*,
                    0 AS booking_count,
                    json_build_object(
                        'cleanliness', lrm.cleanliness,
                        'communication', lrm.communication,
                        'valueForMoney', lrm.value_for_money,
                        'location', lrm.location,
                        'facilityQuality', lrm.facility_quality
                    ) AS review_metrics
                FROM listing_details ld
                LEFT JOIN listing_review_metrics lrm ON lrm.listing_id = ld.id
                LIMIT 1
            `,
            [id],
        );

        return result.rows[0] ?? null;
    },

    async findRankedByKind(kind: ListingKind, limit: number, mode: RankingMode): Promise<ListingRow[]> {
        const db = getDB();
        const sort: ListingSort = mode === 'trending' ? 'trending' : 'rating';
        const result = await db.query<ListingRow>(
            `
                ${buildListingsSelect()}
                WHERE ${PUBLIC_LISTING_CLAUSES.join(' AND ')}
                    AND l.kind = $1
                ${buildOrderBy(sort, 'desc')}
                LIMIT $2
            `,
            [kind, limit],
        );

        return result.rows;
    },

    // backend: models/Listing.js (or .ts)
    async findSavedByUserId(userId: string | number): Promise<ListingRow[]> {
        const db = getDB();
        const query = `
            ${buildListingsSelect()}
            INNER JOIN saved_listings sl ON sl.listing_id = l.id
            WHERE ${PUBLIC_LISTING_CLAUSES.join(' AND ')}
            AND sl.user_id = $1
            ORDER BY sl.created_at DESC
        `;
        const result = await db.query<ListingRow>(query, [userId]);
        return result.rows;
    },

    async saveListing(userId: number, listingId: string): Promise<void> {
        const db = getDB();
        await db.query(
            `INSERT INTO saved_listings (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, listingId]
        );
    },

    async unsaveListing(userId: number, listingId: string): Promise<void> {
        const db = getDB();
        await db.query(
            `DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2`,
            [userId, listingId]
        );
    },
};




// models/Listing.js (or Package.js)

/**
 * FAANG Pattern: Explicit Service-Layer Sync
 * We recalculate the listing's cached price whenever packages change.
 * This keeps the DB "dumb" (no triggers) and logic in Node.js.
 */
async function recalculateListingPrice(listingId: string): Promise<void> {
    const db = getDB();
    await db.query(`
        UPDATE listings
        SET base_price = COALESCE(
            (SELECT MIN(price) FROM service_packages WHERE listing_id = $1), 
            0
        )
        WHERE id = $1;
    `, [listingId]);
}

// You would call this in your Package creation/update/deletion endpoints:
// await PackageModel.create(data);
// await recalculateListingPrice(data.listing_id); 

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

const PUBLIC_LISTING_CLAUSES = [`l.status = 'published'`, `l.deleted_at IS NULL`];

/**
 * NULL-safe sort expressions. Keyset pagination is only correct when the
 * ORDER BY columns can never be NULL (`NULL < $cursor` is NULL, which drops
 * rows from every page after the first). These appear identically in the
 * SELECT, the ORDER BY and the cursor predicate and match the expression
 * indexes created in migrations/027_listing_publish_and_search_alignment.sql.
 */
const RATING_EXPR = 'COALESCE(l.average_rating, 0)';
const REVIEWS_EXPR = 'COALESCE(l.review_count, 0)';
const PRICE_EXPR = 'COALESCE(l.base_price_kobo, 0)';

/** Real verification lives on vendors, not listings.auto_approve. */
const VERIFIED_EXPR = `EXISTS (
  SELECT 1 FROM vendors v
  WHERE v.user_id = l.vendor_id AND v.verification_status = 'verified'
)`;

/**
 * Exact inverse of HALL_AMENITY_META in vendor/models/VendorListing.ts.
 * The wizard writes listing_features.icon = META[amenityId].icon on publish;
 * this maps a filter's amenity id back to that icon. One entry per amenity,
 * one EXISTS per selected amenity ⇒ ALL-of semantics.
 * Keep both maps in lockstep when adding an amenity.
 */
const AMENITY_ICONS: Record<string, string[]> = {
  'capacity': ['capacity'],
  'parking': ['parking'],
  'wifi': ['wifi'],
  'climate-control': ['climate'],
  'backup-generator': ['power'],
  'security-247': ['security-247'],
  'sound-system': ['sound-system'],
  'elevated-stage': ['elevated-stage'],
  'custom-lighting': ['custom-lighting'],
  'led-screens': ['led-screens'],
  'bridal-suite': ['suite'],
  'premium-restrooms': ['premium-restrooms'],
  'furniture-included': ['furniture-included'],
  'prep-kitchen': ['prep-kitchen'],
  'in-house-catering': ['in-house-catering'],
};

type QueryParts = { clauses: string[]; values: unknown[] };

/** Escape %, _ and \ so user input is matched literally by ILIKE. */
function escapeILike(str: string): string {
  return str.replace(/[\\%_]/g, '\\$&');
}

function addValue(values: unknown[], value: unknown): string {
  values.push(value);
  return `$${values.length}`;
}

function buildListingsSelect(): string {
  return `SELECT l.id, l.title, l.headline, l.kind, l.description,
      ${PRICE_EXPR} AS base_price_kobo, l.price_unit,
      l.address_line, l.city, l.state, l.country, l.latitude, l.longitude,
      ${RATING_EXPR} AS average_rating, ${REVIEWS_EXPR} AS review_count,
      l.capacity, l.available_from, l.available_to, l.auto_approve, l.created_at,
      ${VERIFIED_EXPR} AS verified,
      0 AS booking_count,
      COALESCE(asset_data.assets, '[]'::json) AS assets,
      COALESCE(badge_data.badges, '[]'::json) AS badges,
      COALESCE(hall_type_data.hall_types, '[]'::json) AS hall_types
    FROM listings l
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object(
        'id', la.id, 'url', la.url, 'type', la.type,
        'isPrimary', la.is_primary, 'sortOrder', la.sort_order
      ) ORDER BY la.is_primary DESC, la.sort_order ASC, la.created_at ASC) AS assets
      FROM listing_assets la WHERE la.listing_id = l.id
    ) asset_data ON TRUE
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('id', bd.id, 'name', bd.name, 'iconUrl', bd.icon_url)
        ORDER BY bd.name ASC) AS badges
      FROM listing_badges lb
      JOIN badge_dictionary bd ON bd.id = lb.badge_id
      WHERE lb.listing_id = l.id
    ) badge_data ON TRUE
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('id', htd.id, 'label', htd.label, 'icon', htd.icon)
        ORDER BY htd.label ASC) AS hall_types
      FROM listing_hall_types lht
      JOIN hall_type_dictionary htd ON htd.id = lht.type_id
      WHERE lht.listing_id = l.id
    ) hall_type_data ON TRUE`;
}

function buildFilterParts(options: ListingPageOptions): QueryParts {
  const values: unknown[] = [];
  const clauses = [...PUBLIC_LISTING_CLAUSES];
  const { filters } = options;

  if (filters.kind) clauses.push(`l.kind = ${addValue(values, filters.kind)}`);
  if (filters.excludeId) clauses.push(`l.id != ${addValue(values, filters.excludeId)}`);

  if (filters.location) {
    // Publish writes state = nigeria_states.name, city = nigeria_lgas.name,
    // address_line = the wizard's street address. All three are probed.
    const locPattern = addValue(values, `%${escapeILike(filters.location)}%`);
    clauses.push(`(l.state ILIKE ${locPattern} OR l.city ILIKE ${locPattern} OR l.address_line ILIKE ${locPattern}
      OR EXISTS (
        SELECT 1 FROM listing_service_areas lsa
        WHERE lsa.listing_id = l.id AND (lsa.state ILIKE ${locPattern} OR lsa.city ILIKE ${locPattern})
      ))`);
  }

  if (filters.searchTerm) {
    clauses.push(
      `CONCAT_WS(' ', l.title, l.headline, l.description, l.city, l.state) ILIKE ${addValue(values, `%${escapeILike(filters.searchTerm)}%`)}`,
    );
  }

  // capacity comes from the wizard's Capacity amenity (halls only). NULL means
  // "vendor didn't declare it". never hide those listings from a capacity filter.
  if (filters.capacity) clauses.push(`(l.capacity IS NULL OR l.capacity >= ${addValue(values, filters.capacity)})`);
  if (filters.priceMin) clauses.push(`${PRICE_EXPR} >= ${addValue(values, filters.priceMin)}`);
  if (filters.priceMax) clauses.push(`${PRICE_EXPR} <= ${addValue(values, filters.priceMax)}`);
  if (filters.capacityMin) clauses.push(`(l.capacity IS NULL OR l.capacity >= ${addValue(values, filters.capacityMin)})`);
  if (filters.capacityMax) clauses.push(`(l.capacity IS NULL OR l.capacity <= ${addValue(values, filters.capacityMax)})`);
  if (filters.minRating) clauses.push(`${RATING_EXPR} >= ${addValue(values, filters.minRating)}`);
  if (filters.verified) clauses.push(VERIFIED_EXPR);

  // venueTypes: stable dictionary ids (what the wizard writes), ANY-of.
  if (filters.venueTypes?.length) {
    clauses.push(`EXISTS (
      SELECT 1 FROM listing_hall_types lht
      WHERE lht.listing_id = l.id AND lht.type_id = ANY(${addValue(values, filters.venueTypes)}::text[])
    )`);
  }

  // amenities: ALL-of, matched on the icon the publish flow writes.
  if (filters.amenities?.length) {
    for (const amenityId of filters.amenities) {
      const icons = AMENITY_ICONS[amenityId];
      if (!icons) {
        // Unknown amenity id matches nothing rather than being silently ignored.
        clauses.push('FALSE');
        continue;
      }
      clauses.push(`EXISTS (
        SELECT 1 FROM listing_features lf
        WHERE lf.listing_id = l.id AND lf.icon = ANY(${addValue(values, icons)}::text[])
      )`);
    }
  }

  // role: the wizard's SERVICE_TYPES ids, same join table.
  if (filters.role) {
    clauses.push(`EXISTS (
      SELECT 1 FROM listing_hall_types lht
      WHERE lht.listing_id = l.id AND lht.type_id = ${addValue(values, filters.role)}
    )`);
  }

  // coverage: publish writes nigeria_states.name verbatim. Accept the canonical
  // name (what the combobox commits) and tolerate free text like "Abuja" against
  // "Federal Capital Territory (Abuja)".
  if (filters.coverage) {
    const exact = addValue(values, filters.coverage);
    const fuzzy = addValue(values, `%${escapeILike(filters.coverage)}%`);
    clauses.push(`EXISTS (
      SELECT 1 FROM listing_service_areas lsa
      WHERE lsa.listing_id = l.id
        AND (LOWER(lsa.state) = LOWER(${exact}) OR lsa.state ILIKE ${fuzzy})
    )`);
  }

  if (filters.dateFrom || filters.dateTo) {
    const dateFrom = filters.dateFrom || filters.dateTo!;
    const dateTo = filters.dateTo || filters.dateFrom!;
    const fromParam = addValue(values, dateFrom);
    const toParam = addValue(values, dateTo);
    const flexParam = addValue(values, filters.flexible ?? 0);
    // The event must fit SOMEWHERE within [from - flex, to + flex]. flex = 0
    // collapses to the exact-range overlap check used by Booking.checkAvailability.
    clauses.push(`EXISTS (
      SELECT 1 FROM generate_series(-${flexParam}::int, ${flexParam}::int) AS g(shift)
      WHERE NOT EXISTS (
        SELECT 1 FROM listing_unavailable_dates lud
        WHERE lud.listing_id = l.id
          AND lud.start_date <= (${toParam}::date + g.shift)
          AND lud.end_date >= (${fromParam}::date + g.shift)
      )
    )`);
  }

  addCursorClause(clauses, values, options.cursor, options.sort, options.sortDirection);
  return { clauses, values };
}

function comparisonFor(direction: SortDirection): '>' | '<' {
  return direction === 'asc' ? '>' : '<';
}

/**
 * The strict "after this row" complement of buildOrderBy, tie-breaker by
 * tie-breaker. Every branch must mirror the ORDER BY exactly (including the
 * always-DESC created_at/id tail) or pages will skip or repeat rows.
 */
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
  const op = comparisonFor(sortDirection);

  if (sort === 'price') {
    const price = addValue(values, cursor.priceFrom ?? 0);
    const rating = addValue(values, cursor.rating ?? 0);
    clauses.push(`(
      ${PRICE_EXPR} ${op} ${price}
      OR (${PRICE_EXPR} = ${price} AND ${RATING_EXPR} < ${rating})
      OR (${PRICE_EXPR} = ${price} AND ${RATING_EXPR} = ${rating} AND l.created_at < ${createdAt}::timestamptz)
      OR (${PRICE_EXPR} = ${price} AND ${RATING_EXPR} = ${rating} AND l.created_at = ${createdAt}::timestamptz AND l.id < ${id}::uuid)
    )`);
    return;
  }

  if (sort === 'reviews') {
    const reviewCount = addValue(values, cursor.reviewCount ?? 0);
    const rating = addValue(values, cursor.rating ?? 0);
    clauses.push(`(
      ${REVIEWS_EXPR} ${op} ${reviewCount}
      OR (${REVIEWS_EXPR} = ${reviewCount} AND ${RATING_EXPR} < ${rating})
      OR (${REVIEWS_EXPR} = ${reviewCount} AND ${RATING_EXPR} = ${rating} AND l.created_at < ${createdAt}::timestamptz)
      OR (${REVIEWS_EXPR} = ${reviewCount} AND ${RATING_EXPR} = ${rating} AND l.created_at = ${createdAt}::timestamptz AND l.id < ${id}::uuid)
    )`);
    return;
  }

  if (sort === 'newest') {
    clauses.push(`(
      l.created_at ${op} ${createdAt}::timestamptz
      OR (l.created_at = ${createdAt}::timestamptz AND l.id ${op} ${id}::uuid)
    )`);
    return;
  }

  // rating / trending
  const rating = addValue(values, cursor.rating ?? 0);
  const reviewCount = addValue(values, cursor.reviewCount ?? 0);
  clauses.push(`(
    ${RATING_EXPR} ${op} ${rating}
    OR (${RATING_EXPR} = ${rating} AND ${REVIEWS_EXPR} ${op} ${reviewCount})
    OR (${RATING_EXPR} = ${rating} AND ${REVIEWS_EXPR} = ${reviewCount} AND l.created_at < ${createdAt}::timestamptz)
    OR (${RATING_EXPR} = ${rating} AND ${REVIEWS_EXPR} = ${reviewCount} AND l.created_at = ${createdAt}::timestamptz AND l.id < ${id}::uuid)
  )`);
}

function buildOrderBy(sort: ListingSort, direction: SortDirection): string {
  const dir = direction.toUpperCase();
  switch (sort) {
    case 'price':
      return `ORDER BY ${PRICE_EXPR} ${dir}, ${RATING_EXPR} DESC, l.created_at DESC, l.id DESC`;
    case 'reviews':
      return `ORDER BY ${REVIEWS_EXPR} ${dir}, ${RATING_EXPR} DESC, l.created_at DESC, l.id DESC`;
    case 'newest':
      return `ORDER BY l.created_at ${dir}, l.id ${dir}`;
    case 'trending':
    case 'rating':
    default:
      return `ORDER BY ${RATING_EXPR} ${dir}, ${REVIEWS_EXPR} ${dir}, l.created_at DESC, l.id DESC`;
  }
}

export const ListingModel = {
  /**
   * Keyset page: limit+1 rows so "has more" needs no COUNT(*). Cost is O(limit)
   * index reads regardless of depth and page 500 is as cheap as page 1.
   */
  async findPage(options: ListingPageOptions): Promise<ListingRow[]> {
    const db = getDB();
    const { clauses, values } = buildFilterParts(options);
    const limit = addValue(values, options.limit + 1);
    const query = `${buildListingsSelect()} WHERE ${clauses.join(' AND ')} ${buildOrderBy(options.sort, options.sortDirection)} LIMIT ${limit}`;
    const result = await db.query<ListingRow>(query, values);
    return result.rows;
  },

  async findById(id: string): Promise<ListingRow | null> {
    const db = getDB();
    const result = await db.query<ListingRow>(
      `WITH listing_details AS (
        SELECT l.id, l.title, l.headline, l.kind, l.description,
          ${PRICE_EXPR} AS base_price_kobo, l.price_unit,
          l.address_line, l.city, l.state, l.country, l.latitude, l.longitude,
          ${RATING_EXPR} AS average_rating, ${REVIEWS_EXPR} AS review_count,
          l.capacity, l.available_from, l.available_to, l.auto_approve, l.created_at,
          ${VERIFIED_EXPR} AS verified, l.service_metadata,
          COALESCE(asset_data.assets, '[]'::json) AS assets,
          COALESCE(badge_data.badges, '[]'::json) AS badges,
          COALESCE(package_data.packages, '[]'::json) AS packages,
          COALESCE(feature_data.features, '[]'::json) AS features,
          COALESCE(review_data.reviews, '[]'::json) AS reviews,
          COALESCE(area_data.areas, '[]'::json) AS service_areas,
          COALESCE(unavail_data.unavailable_dates, '[]'::json) AS unavailable_dates
        FROM listings l
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object(
            'id', la.id, 'url', la.url, 'type', la.type,
            'isPrimary', la.is_primary, 'sortOrder', la.sort_order
          ) ORDER BY la.is_primary DESC, la.sort_order ASC, la.created_at ASC) AS assets
          FROM listing_assets la WHERE la.listing_id = l.id
        ) asset_data ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object('id', bd.id, 'name', bd.name, 'iconUrl', bd.icon_url)
            ORDER BY bd.name ASC) AS badges
          FROM listing_badges lb
          JOIN badge_dictionary bd ON bd.id = lb.badge_id
          WHERE lb.listing_id = l.id
        ) badge_data ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object(
            'id', sp.id, 'name', sp.name, 'price', sp.price_kobo,
            'description', sp.description, 'isPopular', sp.is_popular, 'sortOrder', sp.sort_order,
            'features', (
              SELECT json_agg(json_build_object('id', pf.id, 'text', pf.text, 'sortOrder', pf.sort_order)
                ORDER BY pf.sort_order ASC)
              FROM package_features pf WHERE pf.package_id = sp.id
            )
          ) ORDER BY sp.sort_order ASC) AS packages
          FROM service_packages sp WHERE sp.listing_id = l.id
        ) package_data ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object('id', lf.id, 'icon', lf.icon, 'label', lf.label, 'value', lf.value)
            ORDER BY lf.sort_order ASC) AS features
          FROM listing_features lf WHERE lf.listing_id = l.id
        ) feature_data ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object('id', lr.id, 'userId', lr.user_id, 'rating', lr.rating, 'body', lr.body, 'createdAt', lr.created_at)
            ORDER BY lr.created_at DESC) AS reviews
          FROM listing_reviews lr WHERE lr.listing_id = l.id
        ) review_data ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object('city', lsa.city, 'state', lsa.state, 'country', lsa.country)
            ORDER BY lsa.city ASC) AS areas
          FROM listing_service_areas lsa WHERE lsa.listing_id = l.id
        ) area_data ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_agg(to_char(d, 'YYYY-MM-DD')) AS unavailable_dates
          FROM (
            SELECT generate_series(lud.start_date, lud.end_date, '1 day'::interval)::date AS d
            FROM listing_unavailable_dates lud WHERE lud.listing_id = l.id
          ) dates
        ) unavail_data ON TRUE
        WHERE ${PUBLIC_LISTING_CLAUSES.join(' AND ')} AND l.id = $1
      )
      SELECT ld.*, 0 AS booking_count,
        json_build_object(
          'cleanliness', lrm.cleanliness, 'communication', lrm.communication,
          'valueForMoney', lrm.value_for_money, 'location', lrm.location,
          'facilityQuality', lrm.facility_quality
        ) AS review_metrics
      FROM listing_details ld
      LEFT JOIN listing_review_metrics lrm ON lrm.listing_id = ld.id
      LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findRankedByKind(kind: ListingKind, limit: number, mode: RankingMode): Promise<ListingRow[]> {
    const db = getDB();
    const sort: ListingSort = mode === 'trending' ? 'trending' : 'rating';
    const result = await db.query<ListingRow>(
      `${buildListingsSelect()}
       WHERE ${PUBLIC_LISTING_CLAUSES.join(' AND ')} AND l.kind = $1
       ${buildOrderBy(sort, 'desc')}
       LIMIT $2`,
      [kind, limit],
    );
    return result.rows;
  },

  async findSavedByUserId(userId: string | number): Promise<ListingRow[]> {
    const db = getDB();
    const result = await db.query<ListingRow>(
      `${buildListingsSelect()}
       INNER JOIN saved_listings sl ON sl.listing_id = l.id
       WHERE ${PUBLIC_LISTING_CLAUSES.join(' AND ')} AND sl.user_id = $1
       ORDER BY sl.created_at DESC`,
      [userId],
    );
    return result.rows;
  },

  async saveListing(userId: number, listingId: string): Promise<void> {
    const db = getDB();
    await db.query(
      `INSERT INTO saved_listings (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, listingId],
    );
  },

  async unsaveListing(userId: number, listingId: string): Promise<void> {
    const db = getDB();
    await db.query(`DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2`, [userId, listingId]);
  },

  async findUnavailableDates(listingId: string): Promise<{ from: string; to: string }[]> {
    const db = getDB();
    const result = await db.query<{ from: string; to: string }>(
      `SELECT to_char(lud.start_date, 'YYYY-MM-DD') AS "from", to_char(lud.end_date, 'YYYY-MM-DD') AS "to"
       FROM listing_unavailable_dates lud
       WHERE lud.listing_id = $1 AND lud.end_date >= CURRENT_DATE
       ORDER BY lud.start_date ASC`,
      [listingId],
    );
    return result.rows;
  },
};
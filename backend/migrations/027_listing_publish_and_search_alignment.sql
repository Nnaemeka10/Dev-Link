-- ============================================================================
-- One migration covering Part 1 (publish/write path) and Part 2 (search).
--
-- lib/db.ts wraps every migration file in BEGIN/COMMIT, so this file must NOT
-- contain its own transaction block and must NOT use CREATE INDEX CONCURRENTLY.
-- Every statement is idempotent - safe to re-run.
-- ============================================================================

-- 1. Split the two catering amenities onto distinct icons.
--    HALL_AMENITY_META previously wrote icon='catering' for BOTH prep-kitchen
--    and in-house-catering, so the amenity filter could not tell them apart.
--    `label` is deterministic, so legacy rows can be re-keyed exactly.
UPDATE listing_features SET icon = 'prep-kitchen'
WHERE icon = 'catering' AND label = 'Prep Kitchen';

UPDATE listing_features SET icon = 'in-house-catering'
WHERE icon = 'catering' AND label = 'In-House Catering';

-- 2. Backfill the cached "from" price for services published with packages but
--    no Standard Rate. base_price_kobo = 0 matched every price filter and sorted
--    as the cheapest result. publishDraft now derives this inside its transaction.
UPDATE listings l
SET base_price_kobo = sub.min_kobo, updated_at = NOW()
FROM (
  SELECT listing_id, MIN(price_kobo) AS min_kobo
  FROM service_packages
  GROUP BY listing_id
) sub
WHERE l.id = sub.listing_id
  AND l.kind = 'service'
  AND l.base_price_kobo = 0
  AND sub.min_kobo > 0
  AND l.deleted_at IS NULL;

-- 3. Map the seeded services to their service types. Migration 022 inserted the
--    dictionary rows but its "backfill" only ran SET updated_at = NOW(), so the
--    role filter (dj / photographer / culinary / ushers / hall-decorator) returned
--    nothing. Vendor-published services already write these rows themselves.
INSERT INTO listing_hall_types (listing_id, type_id)
SELECT l.id, m.type_id
FROM listings l
JOIN (VALUES
  ('DJ Spinall',               'dj'),
  ('Shalamar Photography',     'photographer'),
  ('Blossom Events & Florals', 'hall-decorator'),
  ('Mde Culinary Masters',     'culinary'),
  ('Elite Ushers & Protocols', 'ushers')
) AS m(title, type_id) ON m.title = l.title
WHERE l.kind = 'service' AND l.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- 4. Keyset (cursor) pagination indexes. Each mirrors buildOrderBy() in
--    listings/models/Listing.ts exactly - COALESCE expressions plus the
--    created_at/id tie-breakers - so Postgres walks the index in order and stops
--    at LIMIT instead of sorting the whole filtered set. The partial predicate
--    mirrors PUBLIC_LISTING_CLAUSES; leading `kind` serves the explore tabs.
--    At today's row count the planner still prefers a seq scan; these are here
--    for when inventory grows.
CREATE INDEX IF NOT EXISTS idx_listings_keyset_rating
  ON listings (
    kind,
    COALESCE(average_rating, 0) DESC,
    COALESCE(review_count, 0) DESC,
    created_at DESC,
    id DESC
  )
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_listings_keyset_newest
  ON listings (kind, created_at DESC, id DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_listings_keyset_price
  ON listings (
    kind,
    COALESCE(base_price_kobo, 0) DESC,
    COALESCE(average_rating, 0) DESC,
    created_at DESC,
    id DESC
  )
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_listings_keyset_reviews
  ON listings (
    kind,
    COALESCE(review_count, 0) DESC,
    COALESCE(average_rating, 0) DESC,
    created_at DESC,
    id DESC
  )
  WHERE status = 'published' AND deleted_at IS NULL;

ANALYZE listings;
ANALYZE listing_features;
ANALYZE listing_hall_types;

BEGIN;
-- Listings search backbone
CREATE INDEX IF NOT EXISTS idx_listings_status_kind ON listings (status, kind);

-- Availability checks (booking + flexible search both hit this)
CREATE INDEX IF NOT EXISTS idx_lud_listing_range
  ON listing_unavailable_dates (listing_id, start_date, end_date);

-- Service coverage search: the search query probes listing_service_areas
-- per-listing by listing_id with ILIKE on state/city. The listing_id
-- prefix of this index serves that probe (leading-wildcard ILIKE cannot
-- use the LOWER(state) column directly, but per-listing row counts are
-- tiny, so the prefix scan is the right shape).
CREATE INDEX IF NOT EXISTS idx_service_area_state_lookup
    ON listing_service_areas (listing_id, LOWER(state));

-- REMOVED: CREATE INDEX ... ON listing_coverage_areas (state_id);
-- The `listing_coverage_areas` table was never created , coverage is the
-- `listing_service_areas` variant (migration 006 + 023). Indexing a
-- non-existent table made this migration fail on any fresh database.

CREATE TABLE IF NOT EXISTS listing_amenities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    amenity_id  TEXT NOT NULL,
    value       TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_amenities_listing ON listing_amenities(listing_id);

CREATE TABLE IF NOT EXISTS listing_tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tag         TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_listing_tags_listing ON listing_tags(listing_id);

-- 1. user_default_payment_methods , LIVE-BREAKING.
--    Migration 016 creates it, but it's MISSING on live while the profile
--    module actively queries it (setDefaultPaymentMethod / removePaymentMethod
--    throw `relation does not exist` - HTTP 500).
CREATE TABLE IF NOT EXISTS user_default_payment_methods (
    user_id            BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    authorization_code TEXT NOT NULL,
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 2. listing_unavailability , DEAD TABLE.
--    Created by 006, superseded by listing_unavailable_dates (007), already
--    dropped on live. Drop it everywhere so nobody queries it by accident.
DROP TABLE IF EXISTS listing_unavailability;

-- 3. bookings.guests , MISSING COLUMN.
--    016 §5 adds it, live lacks it, BookingRow types it. Constant default ⇒
--    metadata-only ALTER, instant even on large tables (PostgreSQL 11+).
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS guests INTEGER NOT NULL DEFAULT 1;


COMMIT;
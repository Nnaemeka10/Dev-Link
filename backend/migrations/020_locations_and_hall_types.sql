BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- NIGERIA STATES
-- ============================================================
CREATE TABLE IF NOT EXISTS nigeria_states (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nigeria_states_name_trgm
    ON nigeria_states USING gin (name gin_trgm_ops);

-- ============================================================
-- NIGERIA LGAS
-- ============================================================
CREATE TABLE IF NOT EXISTS nigeria_lgas (
    id TEXT PRIMARY KEY,
    state_id TEXT NOT NULL REFERENCES nigeria_states(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nigeria_lgas_state_id ON nigeria_lgas(state_id);
CREATE INDEX IF NOT EXISTS idx_nigeria_lgas_name_trgm
    ON nigeria_lgas USING gin (name gin_trgm_ops);

-- ============================================================
-- HALL TYPE DICTIONARY
-- Mirrors EVENT_HALL_TYPES from create-listing data.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS hall_type_dictionary (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LISTING HALL TYPES (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_hall_types (
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    type_id TEXT NOT NULL REFERENCES hall_type_dictionary(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (listing_id, type_id)
);
CREATE INDEX IF NOT EXISTS idx_listing_hall_types_listing ON listing_hall_types(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_hall_types_type ON listing_hall_types(type_id);

-- ============================================================
-- TRIGRAM INDEXES ON LISTINGS FOR LOCATION SEARCH
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_state_trgm
    ON listings USING gin (state gin_trgm_ops) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_city_trgm
    ON listings USING gin (city gin_trgm_ops) WHERE city IS NOT NULL;

COMMIT;
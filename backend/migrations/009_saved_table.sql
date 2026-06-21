BEGIN;

-- ==========================================
-- 1. SCHEMA: Create Saved Listings Table
-- ==========================================

-- Many-to-many relationship: users <----> listings
CREATE TABLE IF NOT EXISTS saved_listings (
    user_id BIGINT NOT NULL 
        REFERENCES users(id) ON DELETE CASCADE,

    listing_id UUID NOT NULL
        REFERENCES listings(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, listing_id)
);

-- Fast lookup: "Show all saved listings for this user, newest first"
CREATE INDEX IF NOT EXISTS idx_saved_listings_user
ON saved_listings(user_id, created_at DESC);

-- Fast lookup: "How many users saved this listing?"
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing
ON saved_listings(listing_id);


-- ==========================================
-- 2. SEED: Insert Initial Saved Listings
-- ==========================================

-- User 1 saves The Grand Atrium
INSERT INTO saved_listings (user_id, listing_id)
SELECT 1, id
FROM listings
WHERE title = 'The Grand Atrium'
ON CONFLICT DO NOTHING;

-- User 1 saves Skyline Event Lounge
INSERT INTO saved_listings (user_id, listing_id)
SELECT 1, id
FROM listings
WHERE title = 'Skyline Event Lounge'
ON CONFLICT DO NOTHING;

-- User 2 saves The Grand Atrium
INSERT INTO saved_listings (user_id, listing_id)
SELECT 2, id
FROM listings
WHERE title = 'The Grand Atrium'
ON CONFLICT DO NOTHING;

COMMIT;
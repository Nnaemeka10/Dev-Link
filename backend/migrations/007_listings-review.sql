BEGIN;

-- =========================================================
-- 1. ENUMS
-- =========================================================

DO $$ BEGIN
    CREATE TYPE listing_kind AS ENUM ('hall', 'service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('draft', 'published', 'archived', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_type AS ENUM ('image', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =========================================================
-- 2. CORE LISTINGS TABLE EXTENSIONS
-- =========================================================

ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS kind listing_kind NOT NULL DEFAULT 'hall',

    -- THUMBNAIL STRATEGY (critical for search page)
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,

    -- FULL DESCRIPTION (single rich text block)
    ADD COLUMN IF NOT EXISTS description TEXT,

    -- CAPACITY (HALLS ONLY; NULL for services)
    ADD COLUMN IF NOT EXISTS capacity INT,

    -- AVAILABILITY WINDOW (for halls only)
    ADD COLUMN IF NOT EXISTS available_from TIME,
    ADD COLUMN IF NOT EXISTS available_to TIME,

    -- BOOKING APPROVAL FLOW
    ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT FALSE;


-- =========================================================
-- 3. BADGES SYSTEM
-- =========================================================

CREATE TABLE IF NOT EXISTS badge_dictionary (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_badges (
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    badge_id INT NOT NULL REFERENCES badge_dictionary(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (listing_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_badges_listing_id
    ON listing_badges(listing_id);


-- =========================================================
-- 4. REVIEW METRICS (DENORMALIZED PERFORMANCE LAYER)
-- =========================================================

CREATE TABLE IF NOT EXISTS listing_review_metrics (
    listing_id UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
    cleanliness NUMERIC(3,2) DEFAULT 0,
    communication NUMERIC(3,2) DEFAULT 0,
    value_for_money NUMERIC(3,2) DEFAULT 0,
    location NUMERIC(3,2) DEFAULT 0,
    facility_quality NUMERIC(3,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================================
-- 5. LISTING REVIEWS (CORE FEEDBACK TABLE)
-- =========================================================

CREATE TABLE IF NOT EXISTS listing_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID,

    rating NUMERIC(2,1) CHECK (rating >= 1 AND rating <= 5),
    body TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_reviews_listing
    ON listing_reviews(listing_id);


-- =========================================================
-- 6. AVAILABILITY BLOCKING SYSTEM (CRITICAL FOR DOUBLE BOOKINGS)
-- =========================================================

CREATE TABLE IF NOT EXISTS listing_unavailable_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

    -- supports both single-day and range blocking
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    reason TEXT, -- "booked", "vendor_blocked"

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unavailable_listing_dates
    ON listing_unavailable_dates(listing_id, start_date, end_date);


-- =========================================================
-- 7. BOOKING TABLE (MINIMAL BUT SCALABLE FOUNDATION)
-- =========================================================

CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'declined',
    'cancelled',
    'completed'
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID NOT NULL REFERENCES listings(id),
    user_id BIGINT NOT NULL REFERENCES users(id),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status booking_status DEFAULT 'pending',

    total_amount NUMERIC(12,2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_listing
    ON bookings(listing_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user
    ON bookings(user_id);


-- =========================================================
-- 8. PERFORMANCE INDEXES FOR SEARCH PAGE
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_listings_search_core
    ON listings(kind, status, capacity);

CREATE INDEX IF NOT EXISTS idx_listings_thumbnail
    ON listings(thumbnail_url)
    WHERE thumbnail_url IS NOT NULL;

COMMIT;
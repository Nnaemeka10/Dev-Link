BEGIN;


-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN

    CREATE TYPE listing_kind AS ENUM (
        'hall',
        'service'
    );

EXCEPTION
    WHEN duplicate_object THEN null;

END $$;



DO $$ BEGIN

    CREATE TYPE listing_status AS ENUM (
        'draft',
        'pending_review',
        'published',
        'rejected',
        'suspended',
        'archived'
    );

EXCEPTION
    WHEN duplicate_object THEN null;

END $$;



DO $$ BEGIN

    CREATE TYPE booking_mode AS ENUM (
        'auto',
        'approval_required'
    );

EXCEPTION
    WHEN duplicate_object THEN null;

END $$;



DO $$ BEGIN

    CREATE TYPE asset_type AS ENUM (
        'image',
        'video',
        'virtual_tour'
    );

EXCEPTION
    WHEN duplicate_object THEN null;

END $$;



-- ============================================================
-- LISTINGS CORE TABLE
-- ============================================================


CREATE TABLE IF NOT EXISTS listings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    -- owner/vendor
    vendor_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,


    title TEXT NOT NULL,


    kind listing_kind NOT NULL,


    description TEXT,


    -- pricing

    base_price NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,


    price_unit TEXT
        DEFAULT 'per event',



    -- booking behaviour

    booking_mode booking_mode
        NOT NULL
        DEFAULT 'approval_required',



    -- ========================================================
    -- LOCATION
    -- Only halls should use these fields
    -- Services will keep them NULL
    -- ========================================================

    address_line TEXT,

    city TEXT,

    state TEXT,

    country TEXT DEFAULT 'Nigeria',


    latitude NUMERIC(10,8),

    longitude NUMERIC(11,8),



    -- cached metrics

    average_rating NUMERIC(3,2)
        DEFAULT 0,


    review_count INTEGER
        DEFAULT 0,



    status listing_status
        DEFAULT 'draft',



    created_at TIMESTAMPTZ
        DEFAULT NOW(),


    updated_at TIMESTAMPTZ
        DEFAULT NOW(),


    deleted_at TIMESTAMPTZ



);



-- vendor dashboard lookup

CREATE INDEX IF NOT EXISTS idx_listings_vendor

ON listings(vendor_id)

WHERE deleted_at IS NULL;



-- public listings

CREATE INDEX IF NOT EXISTS idx_listings_public

ON listings(kind,status)

WHERE deleted_at IS NULL;



-- hall filtering

CREATE INDEX IF NOT EXISTS idx_listings_city

ON listings(city)

WHERE kind='hall';





-- ============================================================
-- LISTING ASSETS
-- Cloudinary images/videos
-- ============================================================


CREATE TABLE IF NOT EXISTS listing_assets (


    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    listing_id UUID NOT NULL

        REFERENCES listings(id)

        ON DELETE CASCADE,



    cloudinary_public_id TEXT NOT NULL,


    url TEXT NOT NULL,


    type asset_type DEFAULT 'image',


    is_primary BOOLEAN DEFAULT FALSE,


    sort_order INTEGER DEFAULT 0,


    created_at TIMESTAMPTZ DEFAULT NOW()


);



CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_asset

ON listing_assets(listing_id)

WHERE is_primary = TRUE;



CREATE INDEX IF NOT EXISTS idx_listing_assets_listing

ON listing_assets(listing_id, sort_order);




-- ============================================================
-- LISTING FEATURES
-- ============================================================


CREATE TABLE IF NOT EXISTS listing_features (


    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),


    listing_id UUID NOT NULL

        REFERENCES listings(id)

        ON DELETE CASCADE,


    icon TEXT,


    label TEXT NOT NULL,


    value TEXT NOT NULL,


    sort_order INTEGER DEFAULT 0,


    created_at TIMESTAMPTZ DEFAULT NOW()


);



CREATE INDEX IF NOT EXISTS idx_listing_features_listing

ON listing_features(listing_id);





-- ============================================================
-- SERVICE AREAS
--
-- Only services use this.
--
-- Example:
--
-- Photographer:
-- Lagos
-- Abuja
-- Port Harcourt
--
-- ============================================================


CREATE TABLE IF NOT EXISTS listing_service_areas (


    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    listing_id UUID NOT NULL

        REFERENCES listings(id)

        ON DELETE CASCADE,



    city TEXT NOT NULL,


    state TEXT,


    country TEXT DEFAULT 'Nigeria',


    created_at TIMESTAMPTZ DEFAULT NOW()



);



CREATE INDEX IF NOT EXISTS idx_service_area_listing

ON listing_service_areas(listing_id);



CREATE INDEX IF NOT EXISTS idx_service_area_city

ON listing_service_areas(city);





-- ============================================================
-- LISTING UNAVAILABLE DATES
--
-- Stores ONLY blocked dates
--
-- Reasons:
-- vendor blocked
-- booking already exists
--
-- ============================================================



CREATE TABLE IF NOT EXISTS listing_unavailability (


    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    listing_id UUID NOT NULL

        REFERENCES listings(id)

        ON DELETE CASCADE,



    start_date DATE NOT NULL,


    end_date DATE NOT NULL,



    reason TEXT,



    created_at TIMESTAMPTZ DEFAULT NOW()



);



CREATE INDEX IF NOT EXISTS idx_listing_unavailability_dates


ON listing_unavailability(

    listing_id,

    start_date,

    end_date

);






-- ============================================================
-- LISTING REVIEWS
-- ============================================================


CREATE TABLE IF NOT EXISTS listing_reviews (


    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    listing_id UUID NOT NULL

        REFERENCES listings(id)

        ON DELETE CASCADE,



    user_id BIGINT NOT NULL

        REFERENCES users(id)

        ON DELETE CASCADE,



    booking_id UUID,


    rating NUMERIC(2,1)

        CHECK(
            rating >= 1
            AND
            rating <= 5
        ),



    body TEXT,



    created_at TIMESTAMPTZ DEFAULT NOW(),


    updated_at TIMESTAMPTZ DEFAULT NOW()



);



CREATE INDEX IF NOT EXISTS idx_listing_reviews_listing


ON listing_reviews(listing_id, created_at DESC);



CREATE INDEX IF NOT EXISTS idx_listing_reviews_user


ON listing_reviews(user_id);




COMMIT;
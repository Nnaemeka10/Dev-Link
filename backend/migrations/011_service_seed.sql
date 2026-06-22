-- ==============================================================================
-- MIGRATION: Add Service Packages & Metadata
-- ==============================================================================
-- FAANG Architecture Notes:
-- 1. Money (price) is ALWAYS a strict NUMERIC type, never JSON, to prevent 
--    floating-point math errors and ensure DB-level constraints.
-- 2. Packages & Features are relational tables because they dictate what the 
--    user is actually paying for (requires joins, indexing, and auditing).
-- 3. Requirements & Response times are display-only fluff, so they go into 
--    a JSONB column to keep the schema from bloating with tiny utility tables.
-- ==============================================================================

BEGIN;

-- ==========================================
-- 1. SCHEMA UPDATES
-- ==========================================

-- Add JSONB column for unstructured service display data
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS service_metadata JSONB;

-- Add a DB comment so other devs/AI know the expected shape of this JSON
COMMENT ON COLUMN listings.service_metadata IS 
'Unstructured display data for services. Expected shape: {"requirements": ["string"], "response_time": "string"}. Halls will leave this NULL.';


-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    listing_id UUID NOT NULL 
        REFERENCES listings(id) ON DELETE CASCADE,
        
    name TEXT NOT NULL,
    
    -- CRITICAL: Money must be strictly typed, no JSON strings allowed here
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    description TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    
    -- Ensures vendor can dictate the exact order of packages on the frontend
    sort_order INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup: "Get all packages for this specific listing"
CREATE INDEX IF NOT EXISTS idx_service_packages_listing 
ON service_packages(listing_id, sort_order);


CREATE TABLE IF NOT EXISTS package_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    package_id UUID NOT NULL 
        REFERENCES service_packages(id) ON DELETE CASCADE,
        
    text TEXT NOT NULL,
    
    -- Ensures features display in the exact order the vendor intended
    sort_order INT NOT NULL DEFAULT 0
);

-- Index for fast lookup: "Get all features for this specific package"
CREATE INDEX IF NOT EXISTS idx_package_features_package 
ON package_features(package_id, sort_order);


-- ==========================================
-- 3. SEED DATA
-- ==========================================
-- Prerequisite: Assumes the 5 services from the previous seed script exist.

WITH 
-- A: Grab the IDs of the 5 services we just created
service_ids AS (
    SELECT id, title FROM listings 
    WHERE kind = 'service' 
    AND title IN (
        'DJ Spinall', 
        'Shalamar Photography', 
        'Blossom Events & Florals',
        'Mde Culinary Masters', 
        'Elite Ushers & Protocols'
    )
),

-- B: Define all packages for these services
pkg_data(listing_title, pkg_name, price, description, is_popular, sort_order) AS (
    VALUES 
        -- DJ Spinall
        ('DJ Spinall', 'Basic Set', 450000.00, 'Perfect for intimate gatherings and small parties.', false, 0),
        ('DJ Spinall', 'Standard Vibe', 800000.00, 'Ideal for weddings and corporate events.', true, 1),
        ('DJ Spinall', 'The Spinall Experience', 1500000.00, 'The ultimate package for large scale concerts and luxury events.', false, 2),
        
        -- Shalamar Photography
        ('Shalamar Photography', 'Essential Coverage', 350000.00, '4 hours of photography, 50 edited soft copies.', false, 0),
        ('Shalamar Photography', 'Premium Documentary', 750000.00, '10 hours, 2 photographers, 150 edited pictures, all raw files.', true, 1),
        ('Shalamar Photography', 'Luxury Fine Art', 1200000.00, 'Full day, pre-wedding shoot, luxury photo album, drone coverage.', false, 2),
        
        -- Blossom Events & Florals
        ('Blossom Events & Florals', 'Bud Package', 250000.00, 'Centerpieces for 10 tables and a small stage backdrop.', false, 0),
        ('Blossom Events & Florals', 'Full Bloom', 600000.00, 'Full hall decor, ceiling draping, premium centerpieces, and red carpet.', true, 1),
        
        -- Mde Culinary Masters
        ('Mde Culinary Masters', 'Buffet Basics', 150000.00, 'Rice, 2 proteins, plantain, and standard drinks for 100 guests.', false, 0),
        ('Mde Culinary Masters', 'Continental Deluxe', 350000.00, '3-course meal, custom menu, ushers, and premium wine for 100 guests.', true, 1),
        
        -- Elite Ushers & Protocols
        ('Elite Ushers & Protocols', 'Standard Team', 100000.00, '5 professional ushers for 4 hours.', false, 0),
        ('Elite Ushers & Protocols', 'VIP Protocol', 250000.00, '10 professionally trained hosts, event coordination, and guest management.', true, 1)
),

-- C: Insert Packages
ins_pkgs AS (
    INSERT INTO service_packages (listing_id, name, price, description, is_popular, sort_order)
    SELECT si.id, pd.pkg_name, pd.price, pd.description, pd.is_popular, pd.sort_order
    FROM pkg_data pd
    JOIN service_ids si ON pd.listing_title = si.title
    RETURNING id, listing_id, name
),

-- D: Define all features for the packages
feat_data(listing_title, pkg_name, feature_text, sort_order) AS (
    VALUES 
        -- DJ Spinall Features
        ('DJ Spinall', 'Basic Set', '4 hours of DJ service', 0),
        ('DJ Spinall', 'Basic Set', 'Basic sound system setup', 1),
        ('DJ Spinall', 'Basic Set', '1 wireless microphone', 2),
        ('DJ Spinall', 'Basic Set', 'Pre-event consultation', 3),
        ('DJ Spinall', 'Standard Vibe', '6 hours of DJ service', 0),
        ('DJ Spinall', 'Standard Vibe', 'Premium sound system & subwoofers', 1),
        ('DJ Spinall', 'Standard Vibe', 'Basic stage lighting', 2),
        ('DJ Spinall', 'Standard Vibe', '2 wireless microphones', 3),
        ('DJ Spinall', 'Standard Vibe', 'MC collaboration support', 4),
        ('DJ Spinall', 'The Spinall Experience', 'Full day DJ coverage', 0),
        ('DJ Spinall', 'The Spinall Experience', 'Concert-grade line array sound system', 1),
        ('DJ Spinall', 'The Spinall Experience', 'Intelligent lighting & fog machines', 2),
        ('DJ Spinall', 'The Spinall Experience', 'DJ Booth setup with LED screen', 3),
        ('DJ Spinall', 'The Spinall Experience', 'Dedicated sound engineer', 4),
        ('DJ Spinall', 'The Spinall Experience', 'Custom event playlist & mixing', 5),

        -- Shalamar Photography Features (Sample)
        ('Shalamar Photography', 'Essential Coverage', '4 hours of photography', 0),
        ('Shalamar Photography', 'Essential Coverage', '50 edited soft copies', 1),
        ('Shalamar Photography', 'Premium Documentary', '10 hours of coverage', 0),
        ('Shalamar Photography', 'Premium Documentary', '2 photographers', 1),
        ('Shalamar Photography', 'Premium Documentary', '150 edited pictures', 2),

        -- Blossom Events Features (Sample)
        ('Blossom Events & Florals', 'Bud Package', 'Centerpieces for 10 tables', 0),
        ('Blossom Events & Florals', 'Bud Package', 'Small stage backdrop', 1),
        ('Blossom Events & Florals', 'Full Bloom', 'Full hall decor and ceiling draping', 0),
        ('Blossom Events & Florals', 'Full Bloom', 'Premium centerpieces', 1),
        ('Blossom Events & Florals', 'Full Bloom', 'Red carpet setup', 2),

        -- Mde Culinary Features (Sample)
        ('Mde Culinary Masters', 'Buffet Basics', 'Rice and 2 proteins', 0),
        ('Mde Culinary Masters', 'Buffet Basics', 'Standard drinks for 100 pax', 1),
        ('Mde Culinary Masters', 'Continental Deluxe', 'Custom 3-course menu', 0),
        ('Mde Culinary Masters', 'Continental Deluxe', 'Premium wine service', 1),

        -- Elite Ushers Features (Sample)
        ('Elite Ushers & Protocols', 'Standard Team', '5 professional ushers', 0),
        ('Elite Ushers & Protocols', 'Standard Team', '4 hours of service', 1),
        ('Elite Ushers & Protocols', 'VIP Protocol', '10 trained event hosts', 0),
        ('Elite Ushers & Protocols', 'VIP Protocol', 'Full guest management', 1)
)

-- E: Insert Features (Joining package name + listing title to get the exact package ID)
INSERT INTO package_features (package_id, text, sort_order)
SELECT ip.id, fd.feature_text, fd.sort_order
FROM feat_data fd
JOIN service_ids si ON fd.listing_title = si.title
JOIN ins_pkgs ip ON ip.listing_id = si.id AND ip.name = fd.pkg_name;


-- ==========================================
-- 4. SEED METADATA (JSONB)
-- ==========================================
-- Since we aren't building a Vendor Profile table yet, we store requirements 
-- and response times in the JSONB column.

-- ==========================================
-- 4. SEED METADATA (JSONB)
-- ==========================================

UPDATE listings l
SET service_metadata = jsonb_build_object(
    'requirements', dm.requirements::jsonb,
    'response_time', dm.response_time
)
FROM (
    VALUES 
        ('DJ Spinall', '["Requires minimum 2 hours setup time prior to event.", "Sheltered area required if outdoors.", "Minimum 2 dedicated power outlets required."]', 'within an hour'),
        ('Shalamar Photography', '["Requires access to venue 1 hour before event.", "Outdoor shoots require weather backup plan."]', 'within 2 hours'),
        ('Blossom Events & Florals', '["Setup requires 6 hours prior to event.", "Vendor must provide water access for floral care."]', 'within 3 hours'),
        ('Mde Culinary Masters', '["Requires dedicated kitchen space or tent.", "Menu finalization 48 hours before event."]', 'within 1 hour'),
        ('Elite Ushers & Protocols', '["Requires vendor briefing 24 hours before event.", "Must be provided with guest list and seating chart."]', 'within 30 minutes')
) AS dm(title, requirements, response_time)
WHERE l.title = dm.title; -- ✅ Perfectly safe. It matches the exact 5 titles.

COMMIT;
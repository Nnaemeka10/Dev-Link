BEGIN;

-- 1. Schema Updates: Drop thumbnail and booking_mode, then add headline
ALTER TABLE listings DROP COLUMN IF EXISTS thumbnail_url;
ALTER TABLE listings DROP COLUMN IF EXISTS booking_mode;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS headline TEXT;

-- 2. Insert Badges
INSERT INTO badge_dictionary (name)
VALUES 
  ('Flexible Pricing'),
  ('Catering Included'),
  ('Luxury Venue'),
  ('Outdoor Space'),
  ('Premium Sound System'),
  ('Free Parking'),
  ('Wheelchair Accessible'),
  ('AV Equipment Included');


-- 3. Master CTE Chain: Insert Listings and all related data
WITH 
-- A: Insert the 10 Hall listings (now including headline)
inserted_listings AS (
  INSERT INTO listings (
    id,
    vendor_id, 
    title, 
    kind, 
    description, 
    base_price, 
    price_unit,
    city, 
    state, 
    country, 
    capacity, 
    available_from, 
    available_to,
    auto_approve, 
    status, 
    average_rating, 
    review_count,
    headline
  )
  VALUES
    (gen_random_uuid(), 1, 'The Grand Atrium', 'hall', 'A premium luxury event hall in Victoria Island Lagos.', 1250000, 'per event', 'Lagos', 'Lagos', 'Nigeria', 1200, '08:00', '23:00', true, 'published', 4.9, 128, 'An event marvel in the heart of Lagos'),
    (gen_random_uuid(), 1, 'Skyline Event Lounge', 'hall', 'Modern rooftop event space with skyline views.', 850000, 'per event', 'Lagos', 'Lagos', 'Nigeria', 600, '10:00', '22:00', false, 'published', 4.8, 85, 'Rooftop elegance with breathtaking city views'),
    (gen_random_uuid(), 1, 'The Oriental Garden', 'hall', 'Elegant hall with beautiful indoor garden aesthetics.', 1100000, 'per event', 'Abuja', 'FCT', 'Nigeria', 900, '09:00', '22:00', true, 'published', 4.7, 64, 'A serene botanical escape for your special events'),
    (gen_random_uuid(), 1, 'Harbour Point Hall', 'hall', 'Contemporary waterfront event space.', 950000, 'per event', 'Lagos', 'Lagos', 'Nigeria', 500, '08:00', '23:00', false, 'published', 4.6, 42, 'Contemporary waterfront luxury in Lagos'),
    (gen_random_uuid(), 1, 'The Balmoral', 'hall', 'Classic and highly prestigious event center.', 1500000, 'per event', 'Lagos', 'Lagos', 'Nigeria', 1500, '07:00', '23:59', true, 'published', 4.9, 210, 'Classic prestige for grand celebrations'),
    (gen_random_uuid(), 1, 'Sheba Event Center', 'hall', 'Spacious and affordable hall in the heart of PH.', 700000, 'per event', 'Port Harcourt', 'Rivers', 'Nigeria', 450, '09:00', '22:00', true, 'published', 4.3, 38, 'Affordable spacious luxury in Port Harcourt'),
    (gen_random_uuid(), 1, 'Legend Hall', 'hall', 'Intimate and upscale hall perfect for corporate events.', 600000, 'per event', 'Lagos', 'Lagos', 'Nigeria', 350, '08:00', '21:00', false, 'published', 4.5, 55, 'Intimate upscale sophistication for corporate events'),
    (gen_random_uuid(), 1, 'Muson Centre', 'hall', 'Nigeria''s premier concert and conference hall.', 2000000, 'per event', 'Lagos', 'Lagos', 'Nigeria', 2000, '06:00', '23:59', false, 'published', 4.8, 320, 'Nigeria''s premier concert and conference hub'),
    (gen_random_uuid(), 1, 'Nicon Luxury Hall', 'hall', 'Massive, opulent space for grand celebrations.', 1300000, 'per event', 'Abuja', 'FCT', 'Nigeria', 1100, '08:00', '23:00', true, 'published', 4.4, 71, 'Opulent grandeur in the capital city'),
    (gen_random_uuid(), 1, 'Oceanic Convention Center', 'hall', 'State-of-the-art facility with ocean views.', 1800000, 'per event', 'Lagos', 'Lagos', 'Nigeria', 1800, '07:00', '23:59', false, 'published', 4.7, 145, 'State-of-the-art events by the ocean')
  RETURNING id, title
),

-- B: Define which badges belong to which listing
badge_mapping(title, badge_name) AS (
  VALUES 
    ('The Grand Atrium', 'Luxury Venue'),
    ('The Grand Atrium', 'Catering Included'),
    ('The Grand Atrium', 'Premium Sound System'),
    ('Skyline Event Lounge', 'Outdoor Space'),
    ('Skyline Event Lounge', 'Premium Sound System'),
    ('The Oriental Garden', 'Luxury Venue'),
    ('The Oriental Garden', 'Catering Included'),
    ('Harbour Point Hall', 'Wheelchair Accessible'),
    ('Harbour Point Hall', 'AV Equipment Included'),
    ('The Balmoral', 'Luxury Venue'),
    ('The Balmoral', 'Free Parking'),
    ('The Balmoral', 'Catering Included'),
    ('Sheba Event Center', 'Flexible Pricing'),
    ('Sheba Event Center', 'Free Parking'),
    ('Legend Hall', 'AV Equipment Included'),
    ('Legend Hall', 'Flexible Pricing'),
    ('Muson Centre', 'Premium Sound System'),
    ('Muson Centre', 'Wheelchair Accessible'),
    ('Nicon Luxury Hall', 'Luxury Venue'),
    ('Nicon Luxury Hall', 'Catering Included'),
    ('Oceanic Convention Center', 'Outdoor Space'),
    ('Oceanic Convention Center', 'Luxury Venue'),
    ('Oceanic Convention Center', 'Premium Sound System')
),

-- C: Insert the Badges
ins_badges AS (
  INSERT INTO listing_badges (listing_id, badge_id)
  SELECT il.id, bd.id
  FROM inserted_listings il
  JOIN badge_mapping bm ON il.title = bm.title
  JOIN badge_dictionary bd ON bm.badge_name = bd.name
  RETURNING listing_id
),

-- D: Define review metrics for each listing
metrics_data(title, cleanliness, communication, value_for_money, location, facility_quality) AS (
  VALUES
    ('The Grand Atrium', 4.9, 5.0, 4.7, 4.9, 4.8),
    ('Skyline Event Lounge', 4.8, 4.7, 4.6, 4.9, 4.8),
    ('The Oriental Garden', 4.8, 4.6, 4.5, 4.7, 4.9),
    ('Harbour Point Hall', 4.5, 4.6, 4.7, 4.8, 4.4),
    ('The Balmoral', 4.9, 4.8, 4.6, 4.9, 4.9),
    ('Sheba Event Center', 4.2, 4.4, 4.8, 4.3, 4.1),
    ('Legend Hall', 4.6, 4.5, 4.6, 4.4, 4.5),
    ('Muson Centre', 4.8, 4.7, 4.5, 4.9, 5.0),
    ('Nicon Luxury Hall', 4.5, 4.3, 4.2, 4.6, 4.5),
    ('Oceanic Convention Center', 4.8, 4.8, 4.5, 4.9, 4.8)
),

-- E: Insert Review Metrics
ins_metrics AS (
  INSERT INTO listing_review_metrics (listing_id, cleanliness, communication, value_for_money, location, facility_quality)
  SELECT il.id, md.cleanliness, md.communication, md.value_for_money, md.location, md.facility_quality
  FROM inserted_listings il
  JOIN metrics_data md ON il.title = md.title
  RETURNING listing_id
),

-- F: Define unavailable dates for each listing (Explicitly cast to DATE using ::date)
dates_data(title, start_date, end_date, reason) AS (
  VALUES
    ('The Grand Atrium', '2026-06-25'::date, '2026-06-27'::date, 'booked'),
    ('Skyline Event Lounge', '2025-12-20'::date, '2025-12-31'::date, 'holiday_block'),
    ('The Oriental Garden', '2026-01-10'::date, '2026-01-12'::date, 'maintenance'),
    ('Harbour Point Hall', '2026-03-05'::date, '2026-03-05'::date, 'booked'),
    ('The Balmoral', '2025-12-24'::date, '2025-12-26'::date, 'holiday_block'),
    ('Sheba Event Center', '2026-02-14'::date, '2026-02-14'::date, 'booked'),
    ('Legend Hall', '2026-07-01'::date, '2026-07-04'::date, 'maintenance'),
    ('Muson Centre', '2026-05-15'::date, '2026-05-17'::date, 'booked'),
    ('Nicon Luxury Hall', '2026-08-20'::date, '2026-08-25'::date, 'booked'),
    ('Oceanic Convention Center', '2025-12-01'::date, '2025-12-05'::date, 'booked')
),

-- G: Insert Unavailable Dates
ins_dates AS (
  INSERT INTO listing_unavailable_dates (listing_id, start_date, end_date, reason)
  SELECT il.id, dd.start_date, dd.end_date, dd.reason
  FROM inserted_listings il
  JOIN dates_data dd ON il.title = dd.title
  RETURNING listing_id
),

-- H: Define Assets (Including cloudinary_public_id extracted from the URLs)
assets_data(title, url, cloudinary_public_id, is_primary, sort_order) AS (
  VALUES
    ('The Grand Atrium', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('The Grand Atrium', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('The Grand Atrium', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('Skyline Event Lounge', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Skyline Event Lounge', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Skyline Event Lounge', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('The Oriental Garden', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('The Oriental Garden', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('The Oriental Garden', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('Harbour Point Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Harbour Point Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Harbour Point Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('The Balmoral', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('The Balmoral', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('The Balmoral', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('Sheba Event Center', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Sheba Event Center', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Sheba Event Center', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('Legend Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Legend Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Legend Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('Muson Centre', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Muson Centre', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Muson Centre', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('Nicon Luxury Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Nicon Luxury Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Nicon Luxury Hall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    ('Oceanic Convention Center', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Oceanic Convention Center', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Oceanic Convention Center', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2)
)

-- I: Finally, insert the Assets
INSERT INTO listing_assets (listing_id, url, cloudinary_public_id, is_primary, sort_order)
SELECT il.id, ad.url, ad.cloudinary_public_id, ad.is_primary, ad.sort_order
FROM inserted_listings il
JOIN assets_data ad ON il.title = ad.title;

COMMIT;
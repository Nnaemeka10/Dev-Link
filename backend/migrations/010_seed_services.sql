BEGIN;

-- ==========================================
-- SEED: Insert Service Listings
-- ==========================================

WITH 
-- A: Insert the 5 Service listings
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
    auto_approve, 
    status, 
    average_rating, 
    review_count,
    headline
  )
  VALUES
    (
      gen_random_uuid(), 1, 
      'DJ Spinall', 'service', 
      'With over a decade of experience moving crowds across the globe, DJ Spinall guarantees an unforgettable experience. Specializing in Afrobeats, Hip-Hop, R&B, and Electronic Dance Music.', 
      450000, 'per event', 
      'Lagos', 'Lagos', 'Nigeria', 
      true, 'published', 4.9, 124, 
      'Premium Vibe Controller'
    ),
    (
      gen_random_uuid(), 1, 
      'Shalamar Photography', 'service', 
      'Capturing timeless moments with a blend of documentary and fine-art styles. We specialize in luxury weddings, corporate events, and high-end portrait sessions.', 
      350000, 'per event', 
      'Lagos', 'Lagos', 'Nigeria', 
      true, 'published', 4.8, 98, 
      'Luxury Event Coverage'
    ),
    (
      gen_random_uuid(), 1, 
      'Blossom Events & Florals', 'service', 
      'Transforming ordinary spaces into breathtaking wonderlands. From intimate garden setups to grand ballroom florals, we bring your vision to life.', 
      250000, 'per event', 
      'Abuja', 'FCT', 'Nigeria', 
      true, 'published', 4.7, 76, 
      'Exquisite Decor & Florals'
    ),
    (
      gen_random_uuid(), 1, 
      'Mde Culinary Masters', 'service', 
      'An elite catering company offering a fusion of Nigerian and continental cuisines. Our chefs are trained to deliver 5-star dining experiences anywhere.', 
      150000, 'per event', 
      'Lagos', 'Lagos', 'Nigeria', 
      false, 'published', 4.6, 65, 
      '5-Star Catering Experience'
    ),
    (
      gen_random_uuid(), 1, 
      'Elite Ushers & Protocols', 'service', 
      'Providing highly trained, professional ushers and event hosts for corporate and social events. We ensure your guests are well attended to from start to finish.', 
      100000, 'per event', 
      'Port Harcourt', 'Rivers', 'Nigeria', 
      true, 'published', 4.5, 42, 
      'Professional Event Hosts'
    )
  RETURNING id, title
),

-- B: Map badges to services (Using existing badge dictionary)
badge_mapping(title, badge_name) AS (
  VALUES 
    ('DJ Spinall', 'Premium Sound System'),
    ('DJ Spinall', 'Flexible Pricing'),
    ('Shalamar Photography', 'AV Equipment Included'),
    ('Blossom Events & Florals', 'Outdoor Space'),
    ('Mde Culinary Masters', 'Catering Included'),
    ('Elite Ushers & Protocols', 'Flexible Pricing')
),

-- C: Insert Badges
ins_badges AS (
  INSERT INTO listing_badges (listing_id, badge_id)
  SELECT il.id, bd.id 
  FROM inserted_listings il
  JOIN badge_mapping bm ON il.title = bm.title
  JOIN badge_dictionary bd ON bm.badge_name = bd.name
  RETURNING listing_id
),

-- D: Define review metrics for services
metrics_data(title, cleanliness, communication, value_for_money, location, facility_quality) AS (
  VALUES
    ('DJ Spinall', 0, 4.9, 4.8, 0, 5.0), -- Location/N/A set to 0 for mobile services
    ('Shalamar Photography', 0, 4.8, 4.7, 0, 4.9),
    ('Blossom Events & Florals', 0, 4.6, 4.5, 0, 4.8),
    ('Mde Culinary Masters', 4.9, 4.5, 4.7, 0, 0), -- Facility/N/A set to 0 for catering
    ('Elite Ushers & Protocols', 0, 4.8, 4.6, 0, 0)
),

-- E: Insert Metrics
ins_metrics AS (
  INSERT INTO listing_review_metrics (listing_id, cleanliness, communication, value_for_money, location, facility_quality)
  SELECT il.id, md.cleanliness, md.communication, md.value_for_money, md.location, md.facility_quality
  FROM inserted_listings il
  JOIN metrics_data md ON il.title = md.title
  RETURNING listing_id
),

-- F: Define some blocked dates for services
dates_data(title, start_date, end_date, reason) AS (
  VALUES
    ('DJ Spinall', '2026-12-31'::date, '2026-12-31'::date, 'booked'),
    ('Shalamar Photography', '2026-06-10'::date, '2026-06-15'::date, 'booked'),
    ('Blossom Events & Florals', '2025-12-25'::date, '2025-12-26'::date, 'holiday_block')
),

-- G: Insert Dates
ins_dates AS (
  INSERT INTO listing_unavailable_dates (listing_id, start_date, end_date, reason)
  SELECT il.id, dd.start_date, dd.end_date, dd.reason
  FROM inserted_listings il
  JOIN dates_data dd ON il.title = dd.title
  RETURNING listing_id
),

-- H: Define Assets (Reusing the exact same Cloudinary URLs as Halls)
assets_data(title, url, cloudinary_public_id, is_primary, sort_order) AS (
  VALUES
    -- DJ Spinall
    ('DJ Spinall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('DJ Spinall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('DJ Spinall', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    -- Shalamar Photography
    ('Shalamar Photography', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Shalamar Photography', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Shalamar Photography', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    -- Blossom Events
    ('Blossom Events & Florals', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Blossom Events & Florals', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Blossom Events & Florals', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    -- Mde Culinary
    ('Mde Culinary Masters', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Mde Culinary Masters', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Mde Culinary Masters', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2),
    
    -- Elite Ushers
    ('Elite Ushers & Protocols', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsc_sgnrdp.png', 'populareventsc_sgnrdp', true, 0),
    ('Elite Ushers & Protocols', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsa_y9epf7.png', 'populareventsa_y9epf7', false, 1),
    ('Elite Ushers & Protocols', 'https://res.cloudinary.com/ddgyebvui/image/upload/v1781958095/populareventsd_cglzyg.png', 'populareventsd_cglzyg', false, 2)
)

-- I: Finally, insert the Assets
INSERT INTO listing_assets (listing_id, url, cloudinary_public_id, is_primary, sort_order)
SELECT il.id, ad.url, ad.cloudinary_public_id, ad.is_primary, ad.sort_order
FROM inserted_listings il
JOIN assets_data ad ON il.title = ad.title;

COMMIT;
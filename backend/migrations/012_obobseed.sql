-- ==============================================================================
-- MIGRATION: Seed Features, Reviews, and Service Areas
-- ==============================================================================

BEGIN;

-- ==========================================
-- 1. SEED HALL FEATURES
-- ==========================================
-- We use the exact icon strings your frontend expects: "capacity", "parking", etc.

WITH listing_ids AS (
    SELECT id, title FROM listings WHERE kind = 'hall'
),
features_data(title, icon, label, value, sort_order) AS (
    VALUES 
        -- The Grand Atrium
        ('The Grand Atrium', 'capacity', 'Capacity', 'Up to 1,200 Guests', 0),
        ('The Grand Atrium', 'parking', 'Valet Parking', 'Secure parking for 300+ vehicles', 1),
        ('The Grand Atrium', 'power', 'Backup Generator', 'Industrial grade redundancy', 2),
        ('The Grand Atrium', 'climate', 'Central AC', 'Silent, high-performance cooling', 3),
        ('The Grand Atrium', 'suite', 'Bridal Suite', 'Luxury dressing room & lounge', 4),
        ('The Grand Atrium', 'catering', 'Prep Kitchen', 'Full commercial grade facilities', 5),
        
        -- Skyline Event Lounge
        ('Skyline Event Lounge', 'capacity', 'Capacity', 'Up to 600 Guests', 0),
        ('Skyline Event Lounge', 'climate', 'Rooftop Cooling', 'Dedicated outdoor AC units', 1),
        ('Skyline Event Lounge', 'power', 'Power Supply', '200KVA standby generator', 2),
        
        -- The Oriental Garden
        ('The Oriental Garden', 'capacity', 'Capacity', 'Up to 900 Guests', 0),
        ('The Oriental Garden', 'catering', 'Kitchen Access', 'Dry kitchen and prep area available', 1),
        
        -- Harbour Point Hall
        ('Harbour Point Hall', 'capacity', 'Capacity', 'Up to 500 Guests', 0),
        ('Harbour Point Hall', 'parking', 'Parking', 'Ample secure parking space', 1),
        
        -- The Balmoral
        ('The Balmoral', 'capacity', 'Capacity', 'Up to 1,500 Guests', 0),
        ('The Balmoral', 'parking', 'Valet Parking', 'Complimentary valet service', 1),
        ('The Balmoral', 'suite', 'Bridal Suite', 'Two luxury bridal suites', 2),
        ('The Balmoral', 'power', 'Power', 'Dual 500KVA generators', 3),
        
        -- Sheba Event Center
        ('Sheba Event Center', 'capacity', 'Capacity', 'Up to 450 Guests', 0),
        ('Sheba Event Center', 'catering', 'Kitchen', 'Standard kitchen access included', 1),
        
        -- Legend Hall
        ('Legend Hall', 'capacity', 'Capacity', 'Up to 350 Guests', 0),
        ('Legend Hall', 'climate', 'AC', 'Full central air conditioning', 1),
        
        -- Muson Centre
        ('Muson Centre', 'capacity', 'Capacity', 'Up to 2,000 Guests', 0),
        ('Muson Centre', 'power', 'Power', '100% power uptime guaranteed', 1),
        ('Muson Centre', 'suite', 'Green Room', 'Exclusive VIP green room', 2),
        
        -- Nicon Luxury Hall
        ('Nicon Luxury Hall', 'capacity', 'Capacity', 'Up to 1,100 Guests', 0),
        ('Nicon Luxury Hall', 'parking', 'Parking', 'Multi-story parking complex', 1),
        
        -- Oceanic Convention Center
        ('Oceanic Convention Center', 'capacity', 'Capacity', 'Up to 1,800 Guests', 0),
        ('Oceanic Convention Center', 'power', 'Power', 'Dedicated 11KV substation', 1),
        ('Oceanic Convention Center', 'climate', 'AC', 'State-of-the-art HVAC system', 2)
)

INSERT INTO listing_features (listing_id, icon, label, value, sort_order)
SELECT li.id, fd.icon, fd.label, fd.value, fd.sort_order
FROM features_data fd
JOIN listing_ids li ON fd.title = li.title;


-- ==========================================
-- 2. SEED REVIEWS (For ALL 15 listings)
-- ==========================================

WITH listing_ids AS (
    SELECT id, title FROM listings
),
review_data(title, user_id, rating, body) AS (
    VALUES 
        -- DJ Spinall
        ('DJ Spinall', 2, 5.0, 'Absolutely phenomenal! Booked him for a corporate gala and he understood the assignment perfectly. The transition from background dinner music to full-on party was flawless.'),
        ('DJ Spinall', 3, 5.0, 'Best DJ you can hire in Lagos right now. The crowd didn''t sit down for 4 hours straight.'),
        ('DJ Spinall', 2, 4.8, 'Great sound quality and professional setup.'),
        
        -- Shalamar Photography
        ('Shalamar Photography', 2, 5.0, 'They captured our wedding so beautifully. Every angle was pure art.'),
        ('Shalamar Photography', 3, 4.9, 'Very professional and unobtrusive. The photos were ready ahead of schedule.'),
        
        -- Blossom Events
        ('Blossom Events & Florals', 2, 4.7, 'The floral arrangements were breathtaking. Transformed our venue completely.'),
        ('Blossom Events & Florals', 3, 4.8, 'Highly recommended for luxury events. Attention to detail is top-notch.'),
        
        -- Mde Culinary
        ('Mde Culinary Masters', 2, 4.6, 'Food was delicious and well presented. Service staff were very courteous.'),
        ('Mde Culinary Masters', 3, 4.5, 'Good variety of dishes. Punctual setup.'),
        
        -- Elite Ushers
        ('Elite Ushers & Protocols', 2, 4.9, 'The ushers were extremely well-trained and polite. Added a touch of class to our event.'),
        ('Elite Ushers & Protocols', 3, 4.8, 'Very coordinated team. They managed our 500 guests flawlessly.'),
        
        -- The Grand Atrium
        ('The Grand Atrium', 2, 4.9, 'The acoustics in this hall are world-class. Technical support from the venue staff was impeccable.'),
        ('The Grand Atrium', 3, 5.0, 'Everything screams premium. Our wedding was seamless and our guests haven''t stopped talking about the venue.'),
        ('The Grand Atrium', 2, 4.8, 'Spacious and well-lit. Highly recommended for large conferences.'),
        
        -- Skyline
        ('Skyline Event Lounge', 2, 4.8, 'The rooftop views at sunset are unmatched! Great ambiance.'),
        ('Skyline Event Lounge', 3, 4.7, 'Perfect for cocktail parties. A bit windy in the evenings though.'),
        
        -- Oriental Garden
        ('The Oriental Garden', 2, 4.7, 'Beautiful indoor garden setup. Great for intimate dinners.'),
        ('The Oriental Garden', 3, 4.8, 'The aesthetics are top tier. Very Instagrammable venue.'),
        
        -- Harbour Point
        ('Harbour Point Hall', 2, 4.6, 'Love the waterfront view. The space is very modern.'),
        ('Harbour Point Hall', 3, 4.5, 'Good venue, but sound echoes a bit when it gets crowded.'),
        
        -- The Balmoral
        ('The Balmoral', 2, 5.0, 'Classic prestige. No other venue in Lagos compares to the Balmoral for black-tie events.'),
        ('The Balmoral', 3, 4.9, 'Flawless execution from the event planners at the venue.'),
        
        -- Sheba
        ('Sheba Event Center', 2, 4.3, 'Great value for money in Port Harcourt. Spacious and clean.'),
        ('Sheba Event Center', 3, 4.2, 'Standard facilities, but gets the job done perfectly for corporate events.'),
        
        -- Legend Hall
        ('Legend Hall', 2, 4.5, 'Perfect size for our board retreat. Intimate but professional.'),
        ('Legend Hall', 3, 4.6, 'The AV equipment included was a massive bonus for our presentations.'),
        
        -- Muson
        ('Muson Centre', 2, 4.8, 'Nigeria''s premier hall for a reason. The stage and lighting are concert-grade.'),
        ('Muson Centre', 3, 5.0, 'Saw a show here recently. The sound engineering is flawless.'),
        
        -- Nicon
        ('Nicon Luxury Hall', 2, 4.4, 'Very opulent. The chandeliers and interior design are stunning.'),
        ('Nicon Luxury Hall', 3, 4.5, 'Huge space, easy to decorate and customize to your taste.'),
        
        -- Oceanic
        ('Oceanic Convention Center', 2, 4.7, 'The ocean view is surreal. Hosted our tech conference here and it was a hit.'),
        ('Oceanic Convention Center', 3, 4.8, 'State-of-the-art facility. Very fast WiFi and great power distribution.')
)

INSERT INTO listing_reviews (listing_id, user_id, rating, body)
SELECT li.id, rd.user_id, rd.rating, rd.body
FROM review_data rd
JOIN listing_ids li ON rd.title = li.title;


-- ==========================================
-- 3. SEED SERVICE AREAS (For the 5 Services)
-- ==========================================

WITH listing_ids AS (
    SELECT id, title FROM listings WHERE kind = 'service'
),
areas_data(title, city, state) AS (
    VALUES 
        ('DJ Spinall', 'Lagos', 'Lagos'),
        ('DJ Spinall', 'Abuja', 'FCT'),
        ('DJ Spinall', 'Port Harcourt', 'Rivers'),
        
        ('Shalamar Photography', 'Lagos', 'Lagos'),
        ('Shalamar Photography', 'Abuja', 'FCT'),
        
        ('Blossom Events & Florals', 'Lagos', 'Lagos'),
        ('Blossom Events & Florals', 'Abuja', 'FCT'),
        
        ('Mde Culinary Masters', 'Lagos', 'Lagos'),
        ('Mde Culinary Masters', 'Ogun', 'Ogun'),
        ('Mde Culinary Masters', 'Rivers', 'Rivers'),
        
        ('Elite Ushers & Protocols', 'Lagos', 'Lagos'),
        ('Elite Ushers & Protocols', 'Abuja', 'FCT'),
        ('Elite Ushers & Protocols', 'Portharcourt', 'Rivers') -- Intentional typo to test data resilience
)

INSERT INTO listing_service_areas (listing_id, city, state)
SELECT li.id, ad.city, ad.state
FROM areas_data ad
JOIN listing_ids li ON ad.title = li.title;


-- ==========================================
-- 4. RECALCULATE REVIEW COUNTS
-- Because we just added reviews, let's sync the cached review_count column
-- (Using the explicit service-layer pattern we agreed on)
-- ==========================================

UPDATE listings l
SET review_count = sub.count
FROM (
    SELECT listing_id, COUNT(*) as count
    FROM listing_reviews
    GROUP BY listing_id
) sub
WHERE l.id = sub.listing_id;

COMMIT;
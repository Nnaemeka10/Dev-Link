BEGIN;

WITH service_ids AS (
    SELECT id, title FROM listings WHERE kind = 'service'
)
INSERT INTO listing_service_areas (listing_id, city, state, country)
SELECT si.id, area.city, area.state, 'Nigeria'
FROM service_ids si
JOIN (VALUES
    ('DJ Spinall', 'Lagos', 'Lagos'),
    ('DJ Spinall', 'Abuja', 'FCT'),
    ('DJ Spinall', 'Port Harcourt', 'Rivers'),
    ('Shalamar Photography', 'Lagos', 'Lagos'),
    ('Shalamar Photography', 'Abuja', 'FCT'),
    ('Blossom Events & Florals', 'Lagos', 'Lagos'),
    ('Blossom Events & Florals', 'Abuja', 'FCT'),
    ('Mde Culinary Masters', 'Lagos', 'Lagos'),
    ('Mde Culinary Masters', 'Abeokuta', 'Ogun'),
    ('Mde Culinary Masters', 'Port Harcourt', 'Rivers'),
    ('Elite Ushers & Protocols', 'Lagos', 'Lagos'),
    ('Elite Ushers & Protocols', 'Abuja', 'FCT'),
    ('Elite Ushers & Protocols', 'Port Harcourt', 'Rivers')
) AS area(title, city, state) ON area.title = si.title
ON CONFLICT DO NOTHING;

COMMIT;
BEGIN;

-- ============================================================
-- 1. SEED HALL TYPE DICTIONARY (matches create-listing data.ts)
-- ============================================================
INSERT INTO hall_type_dictionary (id, label, icon) VALUES
  ('wedding-reception',     'Wedding Reception',             'favorite'),
  ('banquet-hall',          'Banquet Hall',                  'restaurant'),
  ('tech-conference',       'Tech Conference',               'laptop_mac'),
  ('corporate-event',       'Corporate Event',               'business_center'),
  ('birthday-party',        'Birthday Party',                'cake'),
  ('cocktail-party',        'Cocktail Party',                'local_bar'),
  ('product-launch',        'Product Launch',                'rocket_launch'),
  ('concert-live-show',     'Concert / Live Show',           'music_note'),
  ('religious-ceremony',    'Religious Ceremony',            'church'),
  ('multipurpose',          'Multipurpose / Flexible Space', 'space_dashboard'),
  ('outdoor-garden',        'Outdoor Garden',                'park'),
  ('exhibition-trade-show', 'Exhibition / Trade Show',       'storefront')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. SEED NIGERIA STATES (matches create-listing data.ts)
-- ============================================================
INSERT INTO nigeria_states (id, name) VALUES
  ('abia', 'Abia'), ('adamawa', 'Adamawa'), ('akwa-ibom', 'Akwa Ibom'),
  ('anambra', 'Anambra'), ('bauchi', 'Bauchi'), ('bayelsa', 'Bayelsa'),
  ('benue', 'Benue'), ('borno', 'Borno'), ('cross-river', 'Cross River'),
  ('delta', 'Delta'), ('ebonyi', 'Ebonyi'), ('edo', 'Edo'),
  ('ekiti', 'Ekiti'), ('enugu', 'Enugu'),
  ('fct', 'Federal Capital Territory (Abuja)'), ('gombe', 'Gombe'),
  ('imo', 'Imo'), ('jigawa', 'Jigawa'), ('kaduna', 'Kaduna'),
  ('kano', 'Kano'), ('katsina', 'Katsina'), ('kebbi', 'Kebbi'),
  ('kogi', 'Kogi'), ('kwara', 'Kwara'), ('lagos', 'Lagos'),
  ('nasarawa', 'Nasarawa'), ('niger', 'Niger'), ('ogun', 'Ogun'),
  ('ondo', 'Ondo'), ('osun', 'Osun'), ('oyo', 'Oyo'),
  ('plateau', 'Plateau'), ('rivers', 'Rivers'), ('sokoto', 'Sokoto'),
  ('taraba', 'Taraba'), ('yobe', 'Yobe'), ('zamfara', 'Zamfara')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. SEED LGAS (matches create-listing data.ts — representative subset)
-- ============================================================
INSERT INTO nigeria_lgas (id, state_id, name) VALUES
  -- Lagos
  ('lagos-agege', 'lagos', 'Agege'), ('lagos-ajeromi-ifelodun', 'lagos', 'Ajeromi-Ifelodun'),
  ('lagos-alimosho', 'lagos', 'Alimosho'), ('lagos-amuwo-odofin', 'lagos', 'Amuwo-Odofin'),
  ('lagos-apapa', 'lagos', 'Apapa'), ('lagos-badagry', 'lagos', 'Badagry'),
  ('lagos-epe', 'lagos', 'Epe'), ('lagos-eti-osa', 'lagos', 'Eti-Osa'),
  ('lagos-ibeju-lekki', 'lagos', 'Ibeju-Lekki'), ('lagos-ifako-ijaiye', 'lagos', 'Ifako-Ijaiye'),
  ('lagos-ikeja', 'lagos', 'Ikeja'), ('lagos-ikorodu', 'lagos', 'Ikorodu'),
  ('lagos-kosofe', 'lagos', 'Kosofe'), ('lagos-lagos-island', 'lagos', 'Lagos Island'),
  ('lagos-lagos-mainland', 'lagos', 'Lagos Mainland'), ('lagos-mushin', 'lagos', 'Mushin'),
  ('lagos-ojo', 'lagos', 'Ojo'), ('lagos-oshodi-isolo', 'lagos', 'Oshodi-Isolo'),
  ('lagos-shomolu', 'lagos', 'Shomolu'), ('lagos-surulere', 'lagos', 'Surulere'),
  -- FCT
  ('fct-abaji', 'fct', 'Abaji'), ('fct-abuja-municipal', 'fct', 'Abuja Municipal'),
  ('fct-bwari', 'fct', 'Bwari'), ('fct-gwagwalada', 'fct', 'Gwagwalada'),
  ('fct-kuje', 'fct', 'Kuje'), ('fct-kwali', 'fct', 'Kwali'),
  -- Rivers
  ('rivers-port-harcourt', 'rivers', 'Port Harcourt'), ('rivers-obio-akpor', 'rivers', 'Obio-Akpor'),
  ('rivers-eleme', 'rivers', 'Eleme'), ('rivers-ikwerre', 'rivers', 'Ikwerre'),
  ('rivers-okrika', 'rivers', 'Okrika'), ('rivers-bonny', 'rivers', 'Bonny'),
  ('rivers-degema', 'rivers', 'Degema'),
  -- Ogun
  ('ogun-abeokuta-north', 'ogun', 'Abeokuta North'), ('ogun-abeokuta-south', 'ogun', 'Abeokuta South'),
  ('ogun-ado-odo-ota', 'ogun', 'Ado-Odo/Ota'), ('ogun-ijebu-ode', 'ogun', 'Ijebu Ode'),
  ('ogun-sagamu', 'ogun', 'Sagamu'), ('ogun-ijebu-north', 'ogun', 'Ijebu North')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. SEED HALL TYPES FOR EXISTING LISTINGS
-- ============================================================
INSERT INTO listing_hall_types (listing_id, type_id)
SELECT l.id, ht.type_id
FROM listings l
JOIN (VALUES
  ('The Grand Atrium',              'wedding-reception'),
  ('The Grand Atrium',              'banquet-hall'),
  ('The Grand Atrium',              'corporate-event'),
  ('Skyline Event Lounge',          'cocktail-party'),
  ('Skyline Event Lounge',          'product-launch'),
  ('The Oriental Garden',           'wedding-reception'),
  ('The Oriental Garden',           'outdoor-garden'),
  ('Harbour Point Hall',            'corporate-event'),
  ('Harbour Point Hall',            'exhibition-trade-show'),
  ('The Balmoral',                  'wedding-reception'),
  ('The Balmoral',                  'banquet-hall'),
  ('The Balmoral',                  'concert-live-show'),
  ('Sheba Event Center',            'birthday-party'),
  ('Sheba Event Center',            'multipurpose'),
  ('Legend Hall',                   'tech-conference'),
  ('Legend Hall',                   'corporate-event'),
  ('Muson Centre',                  'concert-live-show'),
  ('Muson Centre',                  'tech-conference'),
  ('Muson Centre',                  'exhibition-trade-show'),
  ('Nicon Luxury Hall',             'wedding-reception'),
  ('Nicon Luxury Hall',             'banquet-hall'),
  ('Oceanic Convention Center',     'tech-conference'),
  ('Oceanic Convention Center',     'exhibition-trade-show'),
  ('Oceanic Convention Center',     'corporate-event')
) AS ht(title, type_id) ON ht.title = l.title
WHERE l.kind = 'hall'
ON CONFLICT DO NOTHING;

COMMIT;
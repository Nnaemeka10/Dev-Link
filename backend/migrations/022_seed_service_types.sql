BEGIN;

-- Seed service type IDs into hall_type_dictionary
-- (The table name is legacy; it stores types for both halls and services)
INSERT INTO hall_type_dictionary (id, label, icon) VALUES
  ('dj',              'DJ',                'graphic_eq'),
  ('mc',              'MC',                'campaign'),
  ('photographer',    'Photographer',      'photo_camera'),
  ('videographer',    'Videographer',      'videocam'),
  ('event-planner',   'Event Planner',     'event_note'),
  ('makeup-artist',   'Makeup Artist',     'face_retouching_natural'),
  ('ushers',          'Ushers',            'groups'),
  ('security',        'Security',          'security'),
  ('car-rental',      'Car Rental',        'directions_car'),
  ('hall-decorator',  'Hall Decorator',    'yard'),
  ('culinary',        'Culinary / Catering', 'skillet')
ON CONFLICT (id) DO NOTHING;

-- Backfill existing service listings with their types from draft_payload
-- (This fixes services that were published before this fix)
UPDATE listings l
SET updated_at = NOW()
FROM listing_hall_types lht
WHERE l.id = lht.listing_id AND l.kind = 'service';

COMMIT;
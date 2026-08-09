-- 024_add_package_id_to_bookings.sql
BEGIN;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL;

COMMIT;
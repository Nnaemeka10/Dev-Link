-- 034_booking_client_details.sql
-- The booking wizard collects "Notes for vendor" (preferences) and an
-- expected-guest count, but preferences was silently dropped: the API
-- accepted it and no column existed. guests exists (016/025) but was never
-- written. This adds the missing column and the index the vendor bookings
-- page needs for its offset pagination + newest/oldest sorts.
-- Runner wraps this file in BEGIN/COMMIT - no explicit transaction here.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS preferences TEXT;

COMMENT ON COLUMN bookings.preferences IS
'Free-text notes from the customer to the vendor (setup instructions, access notes, etc). Max 1000 chars, enforced in the API.';

-- Vendor bookings list: WHERE l.vendor_id = $1 ORDER BY b.created_at DESC
-- resolves to a per-listing scan on bookings; this covers the join + sort.
CREATE INDEX IF NOT EXISTS idx_bookings_listing_created
ON bookings (listing_id, created_at DESC);
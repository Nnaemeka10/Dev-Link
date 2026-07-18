ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Index to easily find and expire stale bookings
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at 
ON bookings(expires_at) WHERE status = 'pending';
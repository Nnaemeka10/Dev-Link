-- 030_saved_hub.sql
-- Saved hub: bookings location/cancellation, refunds, complaints, reviews.
-- Runner wraps this file in BEGIN/COMMIT - no explicit transaction here.

-- 1. Bookings: service delivery location + cancellation audit ---------------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_location TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings (user_id, status);

-- 2. Refunds (full refund only - one row per booking, reused across attempts)
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    requested_by BIGINT REFERENCES users(id),          -- NULL for system refunds
    amount_kobo BIGINT NOT NULL,
    reason TEXT NOT NULL,                              -- category key
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',     -- pending|approved|processing|completed|rejected|failed
    source VARCHAR(20) NOT NULL DEFAULT 'user',        -- user|vendor_timeout|vendor_decline|admin
    paystack_refund_code VARCHAR,
    processing_error TEXT,
    reviewed_by VARCHAR,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds (status);

-- 3. Complaints (emailed to support now; admin app reads this table later) --
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    category TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',         -- open|in_review|resolved
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints (user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);

-- 4. Reviews: editable, one per booking, kind-specific sub-ratings ---------
ALTER TABLE listing_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE listing_reviews ADD COLUMN IF NOT EXISTS sub_ratings JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_reviews_booking
    ON listing_reviews (booking_id) WHERE booking_id IS NOT NULL;

-- Kind-specific aggregate sub-ratings (halls keep the legacy columns too).
ALTER TABLE listing_review_metrics ADD COLUMN IF NOT EXISTS sub_metrics JSONB NOT NULL DEFAULT '{}';
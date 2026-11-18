-- 035_listing_staged_edits.sql
-- Editing a LIVE listing must never leak unreviewed changes into search.
-- The approved version keeps serving from the relational columns while the
-- vendor's edits sit in draft_payload; pending_review_at marks that a staged
-- version exists and timestamps the moderation queue.
-- Runner wraps this file in BEGIN/COMMIT - no explicit transaction here.

ALTER TABLE listings ADD COLUMN IF NOT EXISTS pending_review_at TIMESTAMPTZ;

COMMENT ON COLUMN listings.pending_review_at IS
'Set when a listing has a draft_payload awaiting moderation. For a PUBLISHED listing the live columns keep serving the approved version until this is cleared. NULL = no staged edits.';

-- Moderation queue: oldest staged edit first.
CREATE INDEX IF NOT EXISTS idx_listings_pending_review
ON listings (pending_review_at)
WHERE pending_review_at IS NOT NULL AND deleted_at IS NULL;

-- Vendor inventory: My Listings orders by created_at within one owner and
-- filters soft-deleted rows. Archived (unlisted) rows stay in this index so
-- the owner still sees them, while public search excludes them by status.
CREATE INDEX IF NOT EXISTS idx_listings_vendor_status
ON listings (vendor_id, status, created_at DESC)
WHERE deleted_at IS NULL;

-- Deletion guard: "does this listing still owe someone an event?"
-- Partial + narrow so the check is an index-only probe, not a bookings scan.
CREATE INDEX IF NOT EXISTS idx_bookings_listing_active
ON bookings (listing_id, end_date)
WHERE status IN ('paid', 'funds_held', 'confirmed', 'completed', 'processing_payout');

ANALYZE listings;
ANALYZE bookings;
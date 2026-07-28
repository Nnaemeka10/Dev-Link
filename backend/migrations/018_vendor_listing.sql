-- ==============================================================================
-- MIGRATION 0004: Vendor Dashboard & Create Listing Infrastructure
-- ==============================================================================

-- 1. Currency Standardization (Kobo BIGINT)
-- Converts naira decimal to kobo integer to match the escrow ledger exactly.
ALTER TABLE listings ALTER COLUMN base_price TYPE BIGINT USING ROUND(base_price * 100);
ALTER TABLE listings RENAME COLUMN base_price TO base_price_kobo;

ALTER TABLE service_packages ALTER COLUMN price TYPE BIGINT USING ROUND(price * 100);
ALTER TABLE service_packages RENAME COLUMN price TO price_kobo;

-- 2. Draft Persistence & Autosave
ALTER TABLE listings ADD COLUMN IF NOT EXISTS draft_payload JSONB;

-- 3. Listing View Analytics
CREATE TABLE IF NOT EXISTS listing_view_events (
    id BIGSERIAL PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    viewer_id BIGINT REFERENCES users(id),
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listing_view_events_listing_date
    ON listing_view_events(listing_id, viewed_at);

-- 4. Role Gating & Permissions
DELETE FROM roles WHERE name IN ('candidate', 'employer');
INSERT INTO roles (name) VALUES ('guest'), ('vendor'), ('admin'), ('support')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);
INSERT INTO user_roles (user_id, role_id)
SELECT user_id, (SELECT id FROM roles WHERE name = 'vendor') FROM vendors
ON CONFLICT DO NOTHING;

-- 5. Rating Recompute Trigger
CREATE OR REPLACE FUNCTION recompute_listing_rating() RETURNS TRIGGER AS $$ BEGIN
  UPDATE listings SET
    average_rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 2) FROM listing_reviews
       WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)), 0),
    review_count = (SELECT COUNT(*) FROM listing_reviews
       WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id))
  WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
  RETURN NULL;
END;
 $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recompute_rating ON listing_reviews;
CREATE TRIGGER trg_recompute_rating
AFTER INSERT OR UPDATE OR DELETE ON listing_reviews
FOR EACH ROW EXECUTE FUNCTION recompute_listing_rating();
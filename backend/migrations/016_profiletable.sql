
-- MIGRATION: Profile Feature — Schema Additions


-- 1. Add profile fields to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url       TEXT,
    ADD COLUMN IF NOT EXISTS location         TEXT,
    ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS deactivated_at   TIMESTAMPTZ;

-- 2. Expand notification preferences to match UI toggles
ALTER TABLE notifications_preferences
    ADD COLUMN IF NOT EXISTS email_promotions     BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sms_alerts           BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS push_notifications   BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS booking_updates      BOOLEAN DEFAULT TRUE;

-- 3. Local blacklist for payment methods Paystack won't let us delete
CREATE TABLE IF NOT EXISTS user_hidden_payment_methods (
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    authorization_code TEXT   NOT NULL,
    hidden_at         TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, authorization_code)
);

-- 4. Local default payment preference. Paystack owns the authorization;
--    this table only controls which reusable method the UI treats as default.
CREATE TABLE IF NOT EXISTS user_default_payment_methods (
    user_id            BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    authorization_code TEXT NOT NULL,
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Preserve guest count so profile booking history can render the real count
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS guests INTEGER NOT NULL DEFAULT 1;

-- 6. Index for profile lookups
CREATE INDEX IF NOT EXISTS idx_users_paystack_customer
    ON users(paystack_customer_code) WHERE paystack_customer_code IS NOT NULL;

-- ==============================================================================
-- MIGRATION 0005: Vendor Payout Method Verification Infrastructure
-- ==============================================================================

-- 1. Add verification columns to vendors table
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS legal_first_name TEXT,
  ADD COLUMN IF NOT EXISTS legal_last_name TEXT,
  ADD COLUMN IF NOT EXISTS resolved_account_name TEXT,
  ADD COLUMN IF NOT EXISTS name_match_score NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS id_type VARCHAR(10),                 -- 'bvn' | 'nin'
  ADD COLUMN IF NOT EXISTS id_number_encrypted BYTEA,            -- pgcrypto
  ADD COLUMN IF NOT EXISTS id_last4 VARCHAR(4),
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS verification_checked_at TIMESTAMPTZ;

-- 2. Add constraint for verification_status
DO $$ BEGIN
  ALTER TABLE vendors ADD CONSTRAINT chk_verification_status
    CHECK (verification_status IN ('pending', 'verified', 'failed', 'manual_review'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Bank master list — cached, never fetched from Paystack at render time
CREATE TABLE IF NOT EXISTS bank_directory (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    country VARCHAR(5) DEFAULT 'NG',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
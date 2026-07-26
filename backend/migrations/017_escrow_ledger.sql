-- ==============================================================================
-- MIGRATION 0003: Escrow, Double-Entry Ledger & Automated Payouts
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add Escrow columns to existing bookings table
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS dva_account_number VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS dva_bank_slug VARCHAR(50),
    ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS received_amount NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dispute_window_closes_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payout_hold BOOLEAN DEFAULT FALSE;

-- Extend booking_status enum to include escrow lifecycle states
DO $$ BEGIN
    ALTER TYPE booking_status ADD VALUE IF EXISTS 'funds_held';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE booking_status ADD VALUE IF EXISTS 'processing_payout';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE booking_status ADD VALUE IF EXISTS 'payout_released';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE booking_status ADD VALUE IF EXISTS 'refunded';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Vendors Table (Bank details encrypted at rest)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    bank_code VARCHAR(10) NOT NULL,
    account_number_encrypted BYTEA NOT NULL,
    account_number_last4 VARCHAR(4) NOT NULL,
    paystack_recipient_code VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ledger Accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type TEXT NOT NULL CHECK (account_type IN ('escrow_holding', 'platform_revenue', 'vendor_payable', 'refund_reserve')),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (account_type, booking_id)
);

-- Exactly one platform_revenue account exists system-wide.
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_revenue_singleton
    ON ledger_accounts (account_type) WHERE account_type = 'platform_revenue';

-- 4. Ledger Entries (Immutable, append-only, balanced)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_group UUID NOT NULL,
    idempotency_key UUID NOT NULL, -- FIX for Issue #2: Prevents duplicate group credits on webhook replay
    account_id UUID REFERENCES ledger_accounts(id) NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
    amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
    description VARCHAR(255) NOT NULL,
    paystack_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_txn_group ON ledger_entries(transaction_group);

-- FIX for Issue #2: Idempotency scoped to the group + account. 
-- A replayed webhook will violate this constraint and safely fail.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_group_idempotency
    ON ledger_entries(idempotency_key, account_id);

-- 5. Webhook Inbox (Durable, async-processed)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(20) NOT NULL DEFAULT 'paystack',
    event_type VARCHAR(50) NOT NULL,
    paystack_event_id VARCHAR(100),
    signature_verified BOOLEAN NOT NULL,
    raw_payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_dedupe
    ON webhook_events(provider, paystack_event_id) WHERE paystack_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_unprocessed ON webhook_events(status, received_at) WHERE status = 'received';

-- 6. Payout Attempts
CREATE TABLE IF NOT EXISTS payout_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) NOT NULL,
    dispatch_reference VARCHAR(100) UNIQUE NOT NULL,
    amount_kobo BIGINT NOT NULL,
    recipient_code VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'created' NOT NULL,
    paystack_transfer_code VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_attempts_status ON payout_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payout_attempts_booking ON payout_attempts(booking_id);

-- 7. Disputes
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) NOT NULL,
    reason TEXT NOT NULL,
    opened_by VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'open' NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);

ALTER TYPE ledger_account_type ADD VALUE IF NOT EXISTS 'paystack_wallet';
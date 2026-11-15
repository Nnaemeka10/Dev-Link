-- 031_payment_core.sql
-- Payment core: deterministic ledger idempotency, tax account, singleton
-- accounts, booking audit + stored money components.
-- Runner wraps this file in BEGIN/COMMIT - no explicit transaction here.

-- 1. Deterministic idempotency keys ------------------------------------------
-- UUID rejected 'refund:<id>' and 'payout_<id>_<ts>' / 'TRF_xxx', which broke
-- every refund and payout ledger post. TEXT lets keys be human-readable and
-- derived from the business event. Existing UUIDs cast losslessly.
ALTER TABLE ledger_entries
    ALTER COLUMN idempotency_key TYPE TEXT USING idempotency_key::text;

-- 2. tax_payable account type (VAT is a liability, not revenue) --------------
ALTER TABLE ledger_accounts DROP CONSTRAINT IF EXISTS ledger_accounts_account_type_check;
ALTER TABLE ledger_accounts ADD CONSTRAINT ledger_accounts_account_type_check
    CHECK (account_type IN (
        'escrow_holding', 'platform_revenue', 'vendor_payable',
        'refund_reserve', 'paystack_wallet', 'tax_payable'
    ));

-- 3. Collapse any duplicate singleton accounts, then enforce one row each ---
-- UNIQUE(account_type, booking_id) does NOT dedupe NULL booking_id, so
-- getOrCreateAccount('paystack_wallet') created a fresh account per call.
DO $$
DECLARE t TEXT; keeper UUID;
BEGIN
    FOREACH t IN ARRAY ARRAY['paystack_wallet', 'refund_reserve', 'platform_revenue'] LOOP
        SELECT id INTO keeper FROM ledger_accounts
        WHERE account_type = t ORDER BY created_at ASC, id ASC LIMIT 1;
        IF keeper IS NOT NULL THEN
            UPDATE ledger_entries SET account_id = keeper
            WHERE account_id IN (SELECT id FROM ledger_accounts WHERE account_type = t AND id <> keeper);
            DELETE FROM ledger_accounts WHERE account_type = t AND id <> keeper;
        END IF;
    END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_paystack_wallet_singleton
    ON ledger_accounts (account_type) WHERE account_type = 'paystack_wallet';
CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_reserve_singleton
    ON ledger_accounts (account_type) WHERE account_type = 'refund_reserve';
CREATE UNIQUE INDEX IF NOT EXISTS uq_tax_payable_singleton
    ON ledger_accounts (account_type) WHERE account_type = 'tax_payable';

-- 4. Booking audit timestamp (queries already write updated_at) --------------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Stored money components - payout/refund math never re-derives them ------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12,2);

-- Backfill components for historical rows (derived, non-destructive).
UPDATE bookings
SET subtotal_amount = ROUND(total_amount / 1.075, 2),
    vat_amount      = total_amount - ROUND(total_amount / 1.075, 2)
WHERE subtotal_amount IS NULL AND total_amount IS NOT NULL;

-- Re-price commission ONLY for bookings that were never paid, so historical
-- paid/payout rows keep the economics they were actually charged under.
UPDATE bookings
SET platform_fee = ROUND(subtotal_amount * 0.10, 2)
WHERE status = 'pending' AND subtotal_amount IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_payout_due
    ON bookings (dispute_window_closes_at)
    WHERE status IN ('confirmed', 'funds_held', 'completed') AND payout_hold = FALSE;
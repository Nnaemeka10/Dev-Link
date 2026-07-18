-- ==============================================================================
-- MIGRATION: Update Bookings Table for Paystack Payment Flow - untracked
-- ==============================================================================

-- 1. Update booking_status enum to include payment states
DO $$ BEGIN
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'paid';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'failed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'expired';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add Payment & Time columns to bookings table
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS booking_reference TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS start_time TIME,
    ADD COLUMN IF NOT EXISTS end_time TIME,
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN',
    ADD COLUMN IF NOT EXISTS payment_reference TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'paystack',
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 3. Add useful indexes for booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference 
    ON bookings(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status 
    ON bookings(user_id, status);
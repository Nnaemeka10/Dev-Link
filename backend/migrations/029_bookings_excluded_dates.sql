-- 029_bookings_excluded_dates.sql
-- Multi-range bookings: start_date / end_date remain the ENVELOPE (earliest
-- start, latest end). excluded_dates holds the interior days the customer
-- deselected in the calendar. Pricing skips them; availability blocks only
-- the contiguous sub-ranges around them, so freed days stay bookable.
-- lib/db.ts wraps this file in BEGIN/COMMIT - no transaction block here.

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS excluded_dates DATE[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN bookings.excluded_dates IS
'Interior days (strictly between start_date and end_date) removed from the booking. Stored sorted, YYYY-MM-DD. Empty array = contiguous booking.';
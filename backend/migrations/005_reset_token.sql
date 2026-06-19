BEGIN;

-- Adds OTP-verification + session-exchange support to password_reset_tokens.
-- Flow: user verifies the 6-digit `token` once via /verify-reset-otp, which
-- issues a short-lived `session_token`. The session_token (not the OTP) is
-- what's actually allowed to set a new password, so the OTP itself can never
-- be replayed against /reset-password directly.

ALTER TABLE password_reset_tokens
    ADD COLUMN IF NOT EXISTS session_token TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_session_token
    ON password_reset_tokens (session_token);

COMMIT;
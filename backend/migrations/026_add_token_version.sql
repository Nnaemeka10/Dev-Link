-- 026_add_token_version.sql
-- SECURITY FIX: JWT session revocation.
--
-- Every user gets a token_version. It is embedded into each JWT when the token
-- is signed (lib/utils.ts generateToken) and re-checked against this column on
-- every request (lib/utils.ts verifyToken). resetPassword and changePassword
-- bump the version, which instantly invalidates ALL previously issued tokens ,
-- a cookie stolen before a password reset stops working the moment the reset
-- completes, instead of surviving for the token's full 7-day life.

-- 1. Add the column allowing NULLs temporarily
ALTER TABLE users ADD COLUMN token_version INTEGER;

-- 2. Populate existing rows (tokens issued before this migration carry no
--    token_version claim and are treated as version 0, so nobody is logged out)
UPDATE users SET token_version = 0 WHERE token_version IS NULL;

-- 3. Enforce the NOT NULL constraint now that old rows are populated
ALTER TABLE users ALTER COLUMN token_version SET NOT NULL;

-- 4. Versions must never be negative
ALTER TABLE users ADD CONSTRAINT users_token_version_non_negative CHECK (token_version >= 0);
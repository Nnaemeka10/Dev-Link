-- 037_token_version_default.sql
-- Migration 026 added users.token_version, backfilled existing rows to 0 and
-- set NOT NULL - but never gave the column a DEFAULT. Every INSERT that omits
-- the column therefore failed with 23502 (not-null violation), which broke
-- BOTH signup paths: UserModel.create and UserModel.createGoogleUser.
--
-- The model now supplies the value explicitly. This default makes the
-- invariant STRUCTURAL as well, so any future insert path - seed script,
-- admin tool, raw SQL, a new auth provider - cannot reintroduce the bug.
-- Runner wraps this file in BEGIN/COMMIT - no transaction statements here.

ALTER TABLE users ALTER COLUMN token_version SET DEFAULT 0;

-- Defensive no-op on a healthy database (026 already enforced NOT NULL).
-- Keeps this file safe to replay against a restored dump where the constraint
-- may have been dropped along with the data.
UPDATE users SET token_version = 0 WHERE token_version IS NULL;

ALTER TABLE users ALTER COLUMN token_version SET NOT NULL;
BEGIN;

-- 1. Add the column allowing NULLs temporarily
ALTER TABLE password_reset_tokens
    ADD COLUMN IF NOT EXISTS link TEXT UNIQUE;

-- 2. Populate old existing rows with a placeholder value so they aren't NULL 
-- (Using the token value as a placeholder ensures it stays UNIQUE)
UPDATE password_reset_tokens 
    SET link = 'http://temporary-placeholder-link/' || token 
    WHERE link IS NULL;

-- 3. Enforce the NOT NULL constraint now that the old data is populated
ALTER TABLE password_reset_tokens 
    ALTER COLUMN link SET NOT NULL;

COMMIT;

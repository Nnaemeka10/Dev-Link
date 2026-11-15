-- 032_webhook_retries.sql
-- Runner wraps this file in BEGIN/COMMIT.

ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_webhook_events_claimable
    ON webhook_events (status, received_at);
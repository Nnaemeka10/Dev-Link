-- 036_chat_foundation.sql
-- Chat foundation: reply threading, edit audit, DB-enforced thread identity,
-- honest read/delivery cursors, inbox controls, support agents, moderation log,
-- and ONE canonical realtime fanout path.
-- The runner wraps this file in BEGIN/COMMIT - no transaction statements here.

-- ============================================================================
-- 1. Reply-to (WhatsApp-style quoted replies)
-- ============================================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to
  ON messages (reply_to_message_id)
  WHERE reply_to_message_id IS NOT NULL;

-- ============================================================================
-- 2. Edit audit trail - BACKEND ONLY. Never selected by any client-facing query.
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_edit_history (
  id           BIGSERIAL PRIMARY KEY,
  message_id   BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  edited_by    BIGINT NOT NULL REFERENCES users(id),
  previous_body TEXT,
  new_body     TEXT,
  edited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_edit_history_message
  ON message_edit_history (message_id, edited_at DESC);

-- ============================================================================
-- 3. Thread identity
--    conversation_context has PK(conversation_id), so uniqueness across
--    (listing, guest) cannot be expressed without knowing the guest. guest_id
--    is that authoritative denormalisation for direct + support threads.
-- ============================================================================
ALTER TABLE conversation_context
  ADD COLUMN IF NOT EXISTS guest_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

-- Backfill from the guest participant. Every direct thread has exactly one
-- 'guest' (findOrCreateDirectConversation always assigns client - guest).
UPDATE conversation_context ctx
SET guest_id = sub.user_id
FROM (
  SELECT DISTINCT ON (cp.conversation_id) cp.conversation_id, cp.user_id
  FROM conversation_participants cp
  WHERE cp.role = 'guest'
  ORDER BY cp.conversation_id, cp.joined_at ASC
) sub
WHERE sub.conversation_id = ctx.conversation_id
  AND ctx.guest_id IS NULL;

-- Dedupe unclaimed listing inquiries before enforcing uniqueness.
-- Keep the thread with the most messages (ties - oldest). Cascade removes the
-- losers' participants, context, sequences and messages (migration 015).
WITH ranked AS (
  SELECT
    ctx.conversation_id,
    ROW_NUMBER() OVER (
      PARTITION BY ctx.listing_id, ctx.guest_id
      ORDER BY (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) DESC,
               c.created_at ASC, c.id ASC
    ) AS rn
  FROM conversation_context ctx
  JOIN conversations c ON c.id = ctx.conversation_id
  WHERE ctx.type = 'listing'
    AND ctx.listing_id IS NOT NULL
    AND ctx.guest_id IS NOT NULL
    AND ctx.booking_id IS NULL
)
DELETE FROM conversations
WHERE id IN (SELECT conversation_id FROM ranked WHERE rn > 1);

-- One OPEN inquiry thread per (listing, guest). Once a booking claims it,
-- booking_id is set and this index no longer covers the row - so the next
-- booking on the same listing correctly gets a fresh thread.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ctx_listing_inquiry
  ON conversation_context (listing_id, guest_id)
  WHERE type = 'listing' AND listing_id IS NOT NULL AND guest_id IS NOT NULL AND booking_id IS NULL;

-- Dedupe support threads, then enforce one per user.
WITH ranked AS (
  SELECT
    ctx.conversation_id,
    ROW_NUMBER() OVER (
      PARTITION BY ctx.guest_id
      ORDER BY (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) DESC,
               c.created_at ASC, c.id ASC
    ) AS rn
  FROM conversation_context ctx
  JOIN conversations c ON c.id = ctx.conversation_id
  WHERE ctx.type = 'support' AND ctx.guest_id IS NOT NULL
)
DELETE FROM conversations
WHERE id IN (SELECT conversation_id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ctx_support_guest
  ON conversation_context (guest_id)
  WHERE type = 'support' AND guest_id IS NOT NULL;

-- (booking_id) uniqueness already exists: uq_conversation_context_booking (028).

-- ============================================================================
-- 4. Read / delivery cursors
--    last_read_message_id and delivered_message_id have always stored a
--    conversation_seq, never a message id. New honestly-named columns,
--    backfilled 1:1. Old columns are left in place for one release and dropped
--    by a later cleanup migration once nothing reads them.
-- ============================================================================
ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS last_read_seq BIGINT NOT NULL DEFAULT 0;
ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS delivered_seq BIGINT NOT NULL DEFAULT 0;

UPDATE conversation_participants
SET last_read_seq = GREATEST(last_read_seq, COALESCE(last_read_message_id, 0)),
    delivered_seq = GREATEST(delivered_seq, COALESCE(delivered_message_id, 0));

-- ============================================================================
-- 5. Per-participant inbox controls
-- ============================================================================
ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cp_user_inbox
  ON conversation_participants (user_id, conversation_id)
  WHERE left_at IS NULL;

-- ============================================================================
-- 6. Support agents
--    Normal user accounts granted the support role. They are participants of
--    every support conversation, so the existing participant-based access rule
--    is the ONLY rule - no special cases in the API or socket layer.
-- ============================================================================
CREATE TABLE IF NOT EXISTS support_agents (
  user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  added_by   BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bootstrap. If the account does not exist yet this is a no-op;
-- SupportAgents.ensureBootstrap() re-runs it lazily so creating the account
-- after migrating still works without a redeploy.
INSERT INTO support_agents (user_id)
SELECT id FROM users WHERE email = 'konohadev@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 7. Moderation log - warn + log, never block (escrow safety nudges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_moderation_events (
  id              BIGSERIAL PRIMARY KEY,
  message_id      BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         BIGINT NOT NULL REFERENCES users(id),
  kind            TEXT NOT NULL,
  excerpt         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_mod_events_created
  ON chat_moderation_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_mod_events_user
  ON chat_moderation_events (user_id, created_at DESC);

-- ============================================================================
-- 8. ONE canonical fanout path
--    Previously the socket emitted a full Message AND this trigger emitted a
--    raw id payload on the same event name - two shapes, one channel. Now the
--    database is the single source of truth: every mutation notifies, the
--    bridge hydrates, and exactly one event shape reaches clients.
--    Fires for server-originated writes too (payment reconciliation), which
--    the socket handler never sees.
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
DROP FUNCTION IF EXISTS notify_new_message();

CREATE OR REPLACE FUNCTION notify_message_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  IF TG_OP = 'DELETE' THEN
    payload := json_build_object(
      'op', 'deleted',
      'message_id', OLD.id,
      'conversation_id', OLD.conversation_id,
      'sender_id', OLD.sender_id
    );
    PERFORM pg_notify('chat_messages', payload::text);
    RETURN OLD;
  END IF;

  payload := json_build_object(
    'op', CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END,
    'message_id', NEW.id,
    'conversation_id', NEW.conversation_id,
    'sender_id', NEW.sender_id
  );
  PERFORM pg_notify('chat_messages', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_message_change ON messages;
CREATE TRIGGER trigger_notify_message_change
AFTER INSERT OR UPDATE OF body, deleted_at, edited_at ON messages
FOR EACH ROW EXECUTE FUNCTION notify_message_change();

ANALYZE messages;
ANALYZE conversation_context;
ANALYZE conversation_participants;
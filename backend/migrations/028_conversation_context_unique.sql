-- 1. Dedupe existing booking threads: keep the one with the most messages
--    (ties - oldest). Deleting the conversation cascades to its context,
--    participants, sequences and messages (migration 015) - messages inside
--    the removed duplicate threads are deleted with them.
WITH ranked AS (
    SELECT
        ctx.conversation_id,
        ROW_NUMBER() OVER (
            PARTITION BY ctx.booking_id
            ORDER BY (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) DESC,
                     c.created_at ASC, c.id ASC
        ) AS rn
    FROM conversation_context ctx
    JOIN conversations c ON c.id = ctx.conversation_id
    WHERE ctx.booking_id IS NOT NULL
)
DELETE FROM conversations
WHERE id IN (SELECT conversation_id FROM ranked WHERE rn > 1);

-- 2. One conversation per booking, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversation_context_booking
ON conversation_context (booking_id)
WHERE booking_id IS NOT NULL;
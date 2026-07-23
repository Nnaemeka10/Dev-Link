-- ==============================================================================
-- MIGRATION 0002: Chat & Realtime Messaging Infrastructure
-- ==============================================================================

-- 1. Conversations & Context
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'support')), -- direct | support
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(), -- updated when a new message is sent
    last_message_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conversation_context (
    conversation_id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    ticket_id UUID, -- For future support tickets
    type TEXT NOT NULL CHECK (type IN ('listing', 'booking', 'support'))
);

-- 2. Participants (Optimization: Replaces message_status table)
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('host', 'guest', 'support')),
    
    -- Read Receipts & Delivery Status (No separate message_status table needed)
    last_read_message_id BIGINT DEFAULT 0,
    delivered_message_id BIGINT DEFAULT 0,
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ, -- For soft-leaving group chats in the future
    
    PRIMARY KEY (conversation_id, user_id)
);

-- 3. Per-Conversation Sequence Table (Optimization: Avoids sequence bloat)
-- Instead of creating a native PG SEQUENCE for every conversation (which pollutes pg_class),
-- we use a centralized table with atomic UPSERTs for monotonic sequence generation.
CREATE TABLE IF NOT EXISTS conversation_sequences (
    conversation_id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
    last_seq BIGINT NOT NULL DEFAULT 0
);

-- 4. Messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY, -- Global ID for standard indexing
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ordering & Idempotency
    conversation_seq BIGINT NOT NULL, -- Monotonic per-conversation sequence
    client_id UUID, -- Idempotency key from frontend to prevent duplicates on retry
    
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
    body TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    -- Enforce idempotency: A client can only send one message per client_id
    UNIQUE (client_id, sender_id),
    -- Enforce ordering uniqueness per conversation
    UNIQUE (conversation_id, conversation_seq)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_seq 
    ON messages(conversation_id, conversation_seq DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender 
    ON messages(sender_id, created_at DESC);

-- 5. Attachments
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INT NOT NULL, -- in bytes
    width INT,
    height INT,
    duration INT, -- in seconds (for voice/video)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message 
    ON message_attachments(message_id);

-- ─── FUNCTIONS & TRIGGERS ────────────────────────────────────────────────────

-- Function to safely get the next sequence for a conversation
CREATE OR REPLACE FUNCTION get_next_conversation_seq(conv_id UUID) 
RETURNS BIGINT AS $$ DECLARE
    next_val BIGINT;
BEGIN
    INSERT INTO conversation_sequences (conversation_id, last_seq) 
    VALUES (conv_id, 1)
    ON CONFLICT (conversation_id) 
    DO UPDATE SET last_seq = conversation_sequences.last_seq + 1
    RETURNING last_seq INTO next_val;
    
    RETURN next_val;
END;
 $$ LANGUAGE plpgsql;

-- Trigger function to broadcast new messages via Postgres LISTEN/NOTIFY
CREATE OR REPLACE FUNCTION notify_new_message() 
RETURNS TRIGGER AS $$ BEGIN
    -- Only broadcast if it's a new insert (not an edit/delete)
    IF TG_OP = 'INSERT' THEN
        -- Payload contains the essential routing data. 
        -- Node.js will fetch the full hydrated message from the DB to avoid payload limits.
        PERFORM pg_notify(
            'chat_messages', 
            json_build_object(
                'message_id', NEW.id,
                'conversation_id', NEW.conversation_id,
                'sender_id', NEW.sender_id
            )::text
        );
    END IF;
    RETURN NEW;
END;
 $$ LANGUAGE plpgsql;

-- Attach the trigger
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
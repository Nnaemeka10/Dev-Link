// src/modules/chat/types/chat.types.ts
export interface ConversationContext {
  conversation_id: string;
  listing_id?: string | null;
  booking_id?: string | null;
  ticket_id?: string | null;
  type: 'listing' | 'booking' | 'support';
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: number;
  role: 'host' | 'guest' | 'support';
  last_read_message_id: number;
  delivered_message_id: number;
  joined_at: string;
  left_at?: string | null;
}

export interface MessageAttachment {
  id: string;
  message_id: number;
  url: string;
  mime_type: string;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export interface Message {
  id: number; // Global ID
  conversation_id: string;
  sender_id: number;
  conversation_seq: number; // Monotonic sequence for ordering
  client_id?: string | null; // Idempotency key
  type: 'text' | 'image' | 'file' | 'system';
  body: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  attachments?: MessageAttachment[];
}

// Payload structure for the LISTEN/NOTIFY event from Postgres
export interface PostgresNotificationPayload {
  message_id: number;
  conversation_id: string;
  sender_id: number;
}
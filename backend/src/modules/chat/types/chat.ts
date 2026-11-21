// src/modules/chat/types/chat.ts
//
// Single source of truth for the chat contract. Row types mirror the tables;
// the *View types are what the API actually returns. The frontend never has to
// guess a shape or derive a display name.

export type ConversationType = 'direct' | 'support';
export type ContextType = 'listing' | 'booking' | 'support';
export type ParticipantRole = 'host' | 'guest' | 'support';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type AttachmentKind = 'image' | 'video' | 'audio' | 'file';

/** Client-visible delivery state. Server truth is the seq cursors below. */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// ---------------------------------------------------------------------------
// Limits - enforced server-side. The client mirrors them for instant feedback
// but is never trusted.
// ---------------------------------------------------------------------------
export const CHAT_LIMITS = {
  MAX_BODY: 4000,
  MAX_ATTACHMENTS: 10,
  IMAGE_MAX_BYTES: 10 * 1024 * 1024,   // 10 MB
  FILE_MAX_BYTES: 25 * 1024 * 1024,    // 25 MB
  EDIT_WINDOW_MS: 15 * 60 * 1000,      // 15 minutes, server clock
  PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  TYPING_TTL_MS: 6000,
} as const;

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
] as const;

export const ALLOWED_FILE_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip',
  'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm',
  'video/mp4', 'video/quicktime', 'video/webm',
] as const;

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------
export interface ConversationContext {
  conversation_id: string;
  listing_id?: string | null;
  booking_id?: string | null;
  ticket_id?: string | null;
  guest_id?: number | null;
  type: ContextType;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: number;
  role: ParticipantRole;
  /** Conversation SEQ, not a message id. */
  last_read_seq: number;
  delivered_seq: number;
  joined_at: string;
  left_at?: string | null;
  archived_at?: string | null;
  muted_until?: string | null;
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
  /** Derived from mime_type so the UI never parses MIME strings. */
  kind?: AttachmentKind;
}

export type AttachmentInput = Omit<MessageAttachment, 'id' | 'message_id' | 'kind'>;

/** Quoted source of a reply. Body is blanked when the source was deleted. */
export interface ReplyPreview {
  id: number;
  seq: number;
  sender_id: number;
  sender_name: string;
  type: MessageType;
  body: string | null;
  deleted: boolean;
  has_attachments: boolean;
}

export interface Message {
  id: number;
  conversation_id: string;
  sender_id: number;
  conversation_seq: number;
  client_id?: string | null;
  type: MessageType;
  body: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  reply_to_message_id?: number | null;
  attachments: MessageAttachment[];
  reply_preview?: ReplyPreview | null;
  /** Ephemeral, client-only. Never persisted or sent by the server. */
  status?: MessageStatus;
  /** Ephemeral, client-only: local upload progress / failure reason. */
  error?: string | null;
}

export interface LastMessagePreview {
  id: number;
  seq: number;
  sender_id: number;
  type: MessageType;
  body: string | null;
  deleted: boolean;
  has_attachments: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API views
// ---------------------------------------------------------------------------
export interface ParticipantView {
  user_id: number;
  role: ParticipantRole;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  last_read_seq: number;
  delivered_seq: number;
}

export interface CounterpartyView {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  /**
   * PRIVACY: populated ONLY when the viewer is a support agent looking at a
   * support thread, so the agent can identify and contact the customer.
   * Always null in buyer↔vendor threads and for the customer's own view -
   * a marketplace conversation must never hand out the other party's email.
   */
  email?: string | null;
}

export interface ListingContextCard {
  id: string;
  title: string;
  kind: 'hall' | 'service';
  image_url: string | null;
  location: string | null;
  price_from_kobo: number;
  price_unit: string;
  status: string;
}

export interface BookingContextCard {
  id: string;
  reference: string;
  status: string;
  start_date: string;
  end_date: string;
  excluded_dates: string[];
  start_time: string | null;
  end_time: string | null;
  guests: number;
  total_amount: number;
  currency: string;
  package_name: string | null;
  event_location: string | null;
}

/**
 * The persisted thread context. Rendered in the thread header regardless of
 * how the user arrived - it is a property of the conversation, not of the
 * navigation. A support thread has neither card.
 *
 * `display_name` is role-aware: a customer sees "EventVnV Support", while a
 * support agent sees the CUSTOMER's name - otherwise every thread in the
 * agent's inbox would carry the same label.
 */
export interface ConversationView {
  id: string;
  type: ConversationType;
  my_role: ParticipantRole;
  is_support: boolean;
  context_type: ContextType | null;
  display_name: string;
  counterparty: CounterpartyView | null;
  listing: ListingContextCard | null;
  booking: BookingContextCard | null;
  participants: ParticipantView[];
  unread_count: number;
  last_read_seq: number;
  delivered_seq: number;
  archived_at: string | null;
  muted_until: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message: LastMessagePreview | null;
}

export interface UnreadSummary {
  total: number;
  guest: number;
  host: number;
  support: number;
}

export interface MessagePage {
  messages: Message[];
  has_more: boolean;
}

export interface SupportAgentView {
  user_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_bootstrap: boolean;
}

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------
/** Payload from the Postgres trigger. Ids only - the bridge hydrates. */
export interface PostgresNotificationPayload {
  op: 'created' | 'updated' | 'deleted';
  message_id: number;
  conversation_id: string;
  sender_id: number;
}

export interface MessageSendPayload {
  conversationId: string;
  clientId: string;
  type?: MessageType;
  body?: string | null;
  attachments?: AttachmentInput[];
  replyToMessageId?: number | null;
}

export interface MessageSendAck {
  ok: boolean;
  message?: Message;
  /** Non-blocking escrow safety nudge. The message is always delivered. */
  warning?: string | null;
  error?: string;
  code?: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: number;
  name: string;
  isTyping: boolean;
}

export interface ReadReceiptPayload {
  conversationId: string;
  readerId: number;
  readUpToSeq: number;
}

export interface DeliveredReceiptPayload {
  conversationId: string;
  userId: number;
  deliveredUpToSeq: number;
}

export interface PresencePayload {
  userId: number;
  isOnline: boolean;
  lastSeenAt: string | null;
}

/** Inbox-level push so unread badges update without opening a thread. */
export interface InboxUpdatePayload {
  conversationId: string;
  message: Message;
}
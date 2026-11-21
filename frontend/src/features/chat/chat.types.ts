// Mirrors modules/chat/types/chat.ts exactly. The server owns display names,
// unread counts, attachment kinds and the persisted context cards - the client
// never re-derives them.

export type ConversationType = "direct" | "support";
export type ContextType = "listing" | "booking" | "support";
export type ParticipantRole = "host" | "guest" | "support";
export type MessageType = "text" | "image" | "file" | "system";
export type AttachmentKind = "image" | "video" | "audio" | "file";
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

/** Which side of the marketplace this inbox shows. Support appears in both. */
export type ChatRole = "guest" | "host";

export const CHAT_LIMITS = {
  MAX_BODY: 4000,
  MAX_ATTACHMENTS: 10,
  IMAGE_MAX_BYTES: 10 * 1024 * 1024,
  FILE_MAX_BYTES: 25 * 1024 * 1024,
  EDIT_WINDOW_MS: 15 * 60 * 1000,
  PAGE_SIZE: 50,
} as const;

export const ALLOWED_IMAGE_MIME = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
] as const;

export const ALLOWED_FILE_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv", "application/zip",
  "audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/webm",
  "video/mp4", "video/quicktime", "video/webm",
] as const;

export interface ChatAttachment {
  id: string;
  message_id: number;
  url: string;
  mime_type: string;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  kind: AttachmentKind;
  /** Local-only: blob preview + upload progress before the server row exists. */
  local_url?: string;
  progress?: number;
}

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

/**
 * `conversation_seq` is null ONLY for a local optimistic row. Server rows
 * always carry a real monotonic seq. Resume cursors must filter out nulls -
 * feeding a synthetic seq into the cursor is what previously broke catch-up
 * permanently.
 */
export interface ChatMessage {
  id: number;
  conversation_id: string;
  sender_id: number;
  conversation_seq: number | null;
  client_id: string | null;
  type: MessageType;
  body: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  reply_to_message_id?: number | null;
  attachments: ChatAttachment[];
  reply_preview?: ReplyPreview | null;
  status?: MessageStatus;
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
   * PRIVACY: only ever populated for a support agent viewing a support
   * thread. Null in buyer↔vendor threads and in the customer's own view.
   * Render it only behind `isSupportAgentView()` - never unconditionally.
   */
  email?: string | null;
}

export interface ListingContextCard {
  id: string;
  title: string;
  kind: "hall" | "service";
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

export interface ChatThread {
  id: string;
  type: ConversationType;
  my_role: ParticipantRole;
  is_support: boolean;
  context_type: ContextType | null;
  display_name: string;
  counterparty: CounterpartyView | null;
  counterparty_online?: boolean;
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

export interface MessagePage {
  messages: ChatMessage[];
  has_more: boolean;
}

export interface UnreadSummary {
  total: number;
  guest: number;
  host: number;
  support: number;
}

export interface MessageSendAck {
  ok: boolean;
  message?: ChatMessage;
  warning?: string | null;
  error?: string;
  code?: string;
}

export interface MessageSendPayload {
  conversationId: string;
  clientId: string;
  type?: MessageType;
  body?: string | null;
  attachments?: Array<Omit<ChatAttachment, "id" | "message_id" | "kind" | "local_url" | "progress">>;
  replyToMessageId?: number | null;
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

export interface SessionReadyPayload {
  userId: number;
  conversationIds: string[];
  isSupportAgent: boolean;
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

export interface UploadSignature {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
  limits: {
    maxAttachments: number;
    imageMaxBytes: number;
    fileMaxBytes: number;
    allowedImageMime: readonly string[];
    allowedFileMime: readonly string[];
  };
}

/** True for a local row that has not been acknowledged by the server yet. */
export function isPendingMessage(message: ChatMessage): boolean {
  return message.conversation_seq == null;
}
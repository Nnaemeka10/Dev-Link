export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";
export type AttachmentType = "image" | "document" | "video" | "audio";

export interface ChatAttachment {
  id: string;
  url: string;
  mime_type: string;
  type: AttachmentType;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export interface ChatMessage {
  id: number; // Global DB ID
  conversation_id: string;
  sender_id: number;
  conversation_seq: number; // For ordering and catch-up
  client_id?: string; // Idempotency key
  type: "text" | "image" | "file" | "system";
  body: string | null;
  created_at: string;
  status?: MessageStatus; // Ephemeral, calculated on frontend
  attachments?: ChatAttachment[];
}

export interface ConversationParticipant {
  userId: number;
  role: "host" | "guest" | "support";
}

export interface ChatThread {
  id: string;
  type: "direct" | "support";
  context_type?: "listing" | "booking" | "support";
  listing_id?: string | null;
  booking_id?: string | null;
  participants: ConversationParticipant[];
  participant_first_name?: string;
  participant_last_name?: string;
  listing_title?: string;
  listing_image?: string | null;
  last_message?: ChatMessage | null;
  unread_count: number;
  last_read_message_id: number;
  delivered_message_id: number;
  updated_at: string;
  name?: string; 
  avatarUrl?: string;
  isOnline?: boolean;
}

// Payload from Postgres LISTEN/NOTIFY via Socket.IO
export interface SocketMessagePayload {
  message_id: number;
  conversation_id: string;
  sender_id: number;
}
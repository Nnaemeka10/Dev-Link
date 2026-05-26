export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export type AttachmentType = "image" | "document" | "video";

export interface ChatAttachment {
  id: string;
  url: string;
  type: AttachmentType;
  fileName: string;
  sizeBytes?: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: MessageStatus;
  attachments?: ChatAttachment[];
}

export interface ChatThread {
  id: string;
  participantIds: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
  isTyping?: boolean; // Ephemeral state, but useful in UI representation
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

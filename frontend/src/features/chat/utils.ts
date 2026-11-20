import { formatWatDate, formatWatTime, watDayKey } from "@/lib/datetime";
import {
  CHAT_LIMITS,
  isPendingMessage,
  type ChatAttachment,
  type ChatMessage,
  type ChatThread,
  type LastMessagePreview,
} from "./chat.types";

/** Server owns display_name; this is only a defensive fallback. */
export function getConversationName(thread?: ChatThread | null): string {
  if (!thread) return "Conversation";
  if (thread.is_support) return "EventVnV Support";
  return thread.display_name?.trim() || "Guest";
}

export function initialsOf(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function participantName(
  first?: string | null,
  last?: string | null
): string {
  return [first, last].filter(Boolean).join(" ").trim();
}

// ---------------------------------------------------------------------------
// Time. Chat uses the same WAT source of truth as bookings so a message
// timestamp and a booking timestamp on the same screen never disagree.
// ---------------------------------------------------------------------------
export function formatMessageTime(iso: string): string {
  return formatWatTime(iso);
}

export function formatDateSeparator(iso: string): string {
  const key = watDayKey(iso);
  const today = watDayKey(new Date());
  if (!key || !today) return formatWatDate(iso);

  const yesterday = watDayKey(new Date(Date.now() - 86_400_000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return formatWatDate(iso);
}

/** Inbox row: time today, "Yesterday", then a date. Never a bare clock for old threads. */
export function formatInboxTimestamp(iso?: string | null): string {
  if (!iso) return "";
  const key = watDayKey(iso);
  const today = watDayKey(new Date());
  const yesterday = watDayKey(new Date(Date.now() - 86_400_000));
  if (key && key === today) return formatWatTime(iso);
  if (key && key === yesterday) return "Yesterday";
  return formatWatDate(iso);
}

export function formatLastSeen(iso?: string | null): string {
  if (!iso) return "Offline";
  const key = watDayKey(iso);
  const today = watDayKey(new Date());
  if (key && key === today) return `Last seen ${formatWatTime(iso)}`;
  return `Last seen ${formatWatDate(iso)}`;
}

// ---------------------------------------------------------------------------
// Previews
// ---------------------------------------------------------------------------
function attachmentLabel(attachments: { kind?: string; mime_type?: string }[]): string {
  const first = attachments[0];
  const kind = first?.kind ?? (first?.mime_type?.startsWith("image/") ? "image" : "file");
  const count = attachments.length;
  const noun =
    kind === "image" ? "Photo" : kind === "video" ? "Video" : kind === "audio" ? "Voice note" : "File";
  return count > 1 ? `${count} ${noun.toLowerCase()}s` : noun;
}

export function messagePreviewText(message: ChatMessage): string {
  if (message.deleted_at) return "Message deleted";
  if (message.body?.trim()) return message.body.trim();
  if (message.attachments?.length) return attachmentLabel(message.attachments);
  return "";
}

export function lastMessagePreviewText(preview?: LastMessagePreview | null): string {
  if (!preview) return "No messages yet";
  if (preview.deleted) return "Message deleted";
  if (preview.type === "system") return preview.body?.trim() || "Booking update";
  if (preview.body?.trim()) return preview.body.trim();
  if (preview.has_attachments) return "Attachment";
  return "No messages yet";
}

// ---------------------------------------------------------------------------
// Permissions - mirror the server rules so the UI never offers a doomed action
// ---------------------------------------------------------------------------
export function canEditMessage(message: ChatMessage, currentUserId: number): boolean {
  if (isPendingMessage(message)) return false;
  if (message.deleted_at) return false;
  if (message.type === "system") return false;
  if (Number(message.sender_id) !== Number(currentUserId)) return false;
  return Date.now() - new Date(message.created_at).getTime() <= CHAT_LIMITS.EDIT_WINDOW_MS;
}

export function canDeleteMessage(message: ChatMessage, currentUserId: number): boolean {
  if (isPendingMessage(message)) return false;
  if (message.deleted_at) return false;
  if (message.type === "system") return false;
  return Number(message.sender_id) === Number(currentUserId);
}

export function canReplyToMessage(message: ChatMessage): boolean {
  return !isPendingMessage(message) && !message.deleted_at && message.type !== "system";
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

export function isImageAttachment(attachment: ChatAttachment): boolean {
  return attachment.kind === "image" || attachment.mime_type?.startsWith("image/");
}

/** Consecutive messages from one author within 5 minutes collapse into a run. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export interface MessageGroupFlags {
  showDateSeparator: boolean;
  dateLabel: string;
  startsRun: boolean;
  endsRun: boolean;
}

export function computeGroupFlags(
  messages: ChatMessage[],
  index: number
): MessageGroupFlags {
  const current = messages[index];
  const previous = messages[index - 1];
  const next = messages[index + 1];

  const dayKey = watDayKey(current.created_at);
  const prevDayKey = previous ? watDayKey(previous.created_at) : null;
  const showDateSeparator = !previous || dayKey !== prevDayKey;

  const sameAuthor = (a?: ChatMessage, b?: ChatMessage) =>
    !!a && !!b && a.sender_id === b.sender_id && a.type !== "system" && b.type !== "system";

  const withinWindow = (a?: ChatMessage, b?: ChatMessage) =>
    !!a &&
    !!b &&
    Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) <=
      GROUP_WINDOW_MS;

  const continuesPrev =
    sameAuthor(previous, current) &&
    withinWindow(previous, current) &&
    watDayKey(previous!.created_at) === dayKey;

  const continuesNext =
    sameAuthor(current, next) &&
    withinWindow(current, next) &&
    watDayKey(next!.created_at) === dayKey;

  return {
    showDateSeparator,
    dateLabel: formatDateSeparator(current.created_at),
    startsRun: !continuesPrev,
    endsRun: !continuesNext,
  };
}

/**
 * Merge server truth with local optimistic rows. Pending rows always sort last
 * because they are newer than anything the server has acknowledged.
 */
export function mergeWithPending(
  messages: ChatMessage[],
  pending: ChatMessage[]
): ChatMessage[] {
  if (pending.length === 0) return messages;
  const knownClientIds = new Set(
    messages.map((m) => m.client_id).filter((id): id is string => !!id)
  );
  return [...messages, ...pending.filter((p) => !p.client_id || !knownClientIds.has(p.client_id))];
}

/** Highest REAL seq - nulls (optimistic rows) must never enter this. */
export function highestSeq(messages: ChatMessage[]): number {
  let max = 0;
  for (const message of messages) {
    if (message.conversation_seq != null && message.conversation_seq > max) {
      max = message.conversation_seq;
    }
  }
  return max;
}

export function sortById(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const aSeq = a.conversation_seq;
    const bSeq = b.conversation_seq;
    if (aSeq == null && bSeq == null) return a.id - b.id;
    if (aSeq == null) return 1;
    if (bSeq == null) return -1;
    return aSeq - bSeq;
  });
}

export function newClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts. Still a valid v4-shaped UUID for the
  // server's uuid column.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
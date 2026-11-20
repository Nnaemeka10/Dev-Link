import { apiFetch } from "@/lib/api";
import {
  ALLOWED_FILE_MIME,
  ALLOWED_IMAGE_MIME,
  CHAT_LIMITS,
  type ChatAttachment,
  type ChatMessage,
  type ChatRole,
  type ChatThread,
  type MessagePage,
  type MessageSendPayload,
  type SupportAgentView,
  type UnreadSummary,
  type UploadSignature,
} from "./chat.types";

export interface CreateConversationInput {
  listingId?: string;
  bookingId?: string;
  support?: boolean;
}

export async function fetchConversations(
  role: ChatRole,
  opts: { archived?: boolean; limit?: number; cursor?: string } = {}
): Promise<ChatThread[]> {
  const params = new URLSearchParams({ role });
  if (opts.archived) params.set("archived", "true");
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.cursor) params.set("cursor", opts.cursor);
  return apiFetch<ChatThread[]>(`/api/chat/conversations?${params.toString()}`, {
    redirectOn401: false,
  });
}

export async function fetchConversation(id: string): Promise<ChatThread> {
  return apiFetch<ChatThread>(`/api/chat/conversations/${id}`, { redirectOn401: false });
}

export async function fetchUnread(): Promise<UnreadSummary> {
  return apiFetch<UnreadSummary>("/api/chat/unread", { redirectOn401: false });
}

export async function fetchMessages(
  conversationId: string,
  opts: { cursor?: string | null; direction?: "before" | "after"; limit?: number } = {}
): Promise<MessagePage> {
  const params = new URLSearchParams();
  if (opts.cursor) params.set("cursor", opts.cursor);
  if (opts.direction) params.set("direction", opts.direction);
  params.set("limit", String(opts.limit ?? CHAT_LIMITS.PAGE_SIZE));
  return apiFetch<MessagePage>(
    `/api/chat/conversations/${conversationId}/messages?${params.toString()}`,
    { redirectOn401: false }
  );
}

export async function createConversation(
  input: CreateConversationInput
): Promise<{ id: string; conversation: ChatThread | null }> {
  return apiFetch("/api/chat/conversations", {
    method: "POST",
    body: JSON.stringify(input),
    redirectOn401: false,
  });
}

export async function markConversationRead(
  conversationId: string,
  seq: number
): Promise<{ readUpToSeq: number }> {
  return apiFetch(`/api/chat/conversations/${conversationId}/read`, {
    method: "POST",
    body: JSON.stringify({ seq }),
    redirectOn401: false,
  });
}

export async function editMessage(
  conversationId: string,
  messageId: number,
  body: string
): Promise<ChatMessage> {
  return apiFetch(`/api/chat/conversations/${conversationId}/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
    redirectOn401: false,
  });
}

export async function deleteMessage(
  conversationId: string,
  messageId: number
): Promise<ChatMessage> {
  return apiFetch(`/api/chat/conversations/${conversationId}/messages/${messageId}`, {
    method: "DELETE",
    redirectOn401: false,
  });
}

export async function setArchived(
  conversationId: string,
  archived: boolean
): Promise<{ archived: boolean }> {
  return apiFetch(`/api/chat/conversations/${conversationId}/archive`, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
    redirectOn401: false,
  });
}

export async function setMuted(
  conversationId: string,
  until: string | null
): Promise<{ mutedUntil: string | null }> {
  return apiFetch(`/api/chat/conversations/${conversationId}/mute`, {
    method: "PATCH",
    body: JSON.stringify({ until }),
    redirectOn401: false,
  });
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------
export async function getUploadSignature(): Promise<UploadSignature> {
  // POST is the canonical route. The old client called GET against a POST-only
  // endpoint, which is why attachments never worked at all.
  return apiFetch<UploadSignature>("/api/chat/upload-signature", {
    method: "POST",
    redirectOn401: false,
  });
}

/** Cloudinary buckets audio under "video"; documents must go to "raw". */
function resourceTypeFor(mime: string): "image" | "video" | "raw" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return "video";
  return "raw";
}

export function attachmentKindFor(mime: string): ChatAttachment["kind"] {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", heic: "image/heic", heif: "image/heif", pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain", csv: "text/csv", zip: "application/zip",
  mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg",
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
};

/**
 * The browser's File.type is authoritative. Cloudinary's `format` is only an
 * extension ("pdf"), and the old code sent the literal string "image/*" -
 * neither is a MIME type, which broke every downstream render/download path.
 */
function resolveMime(file: File): string {
  const declared = (file.type || "").toLowerCase().trim();
  if (declared && declared !== "application/octet-stream") return declared;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[ext] ?? "application/octet-stream";
}

export function validateFile(file: File): string | null {
  const mime = resolveMime(file);
  const isImage = (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);
  const isFile = (ALLOWED_FILE_MIME as readonly string[]).includes(mime);
  if (!isImage && !isFile) return `${file.name}: that file type isn't supported.`;
  if (isImage && file.size > CHAT_LIMITS.IMAGE_MAX_BYTES) {
    return `${file.name}: images must be 10 MB or smaller.`;
  }
  if (!isImage && file.size > CHAT_LIMITS.FILE_MAX_BYTES) {
    return `${file.name}: files must be 25 MB or smaller.`;
  }
  return null;
}

export interface UploadedAttachment {
  url: string;
  mime_type: string;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

/**
 * Direct-to-Cloudinary upload with progress and cancellation. XHR rather than
 * fetch because upload progress is required and fetch cannot report it.
 */
export function uploadAttachment(
  file: File,
  signature: UploadSignature,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<UploadedAttachment> {
  return new Promise((resolve, reject) => {
    const mime = resolveMime(file);
    const resource = resourceTypeFor(mime);

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("folder", signature.folder);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resource}/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`${file.name}: upload failed. Please try again.`));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          mime_type: mime,
          size: Number(data.bytes ?? file.size),
          width: data.width ?? null,
          height: data.height ?? null,
          duration: data.duration ?? null,
        });
      } catch {
        reject(new Error(`${file.name}: upload failed. Please try again.`));
      }
    };

    xhr.onerror = () => reject(new Error(`${file.name}: network error during upload.`));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

// ---------------------------------------------------------------------------
// Support agents
// ---------------------------------------------------------------------------
export async function fetchSupportAgents(): Promise<SupportAgentView[]> {
  return apiFetch<SupportAgentView[]>("/api/chat/support/agents", { redirectOn401: false });
}

export async function addSupportAgent(userId: number): Promise<SupportAgentView[]> {
  return apiFetch<SupportAgentView[]>("/api/chat/support/agents", {
    method: "POST",
    body: JSON.stringify({ userId }),
    redirectOn401: false,
  });
}

export async function removeSupportAgent(userId: number): Promise<SupportAgentView[]> {
  return apiFetch<SupportAgentView[]>(`/api/chat/support/agents/${userId}`, {
    method: "DELETE",
    redirectOn401: false,
  });
}

export type { MessageSendPayload };
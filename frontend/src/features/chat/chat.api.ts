import { apiFetch } from "@/lib/api";
import type { ChatMessage, ChatThread } from "./chat.types";

export async function fetchConversations(): Promise<ChatThread[]> {
  return apiFetch<ChatThread[]>("/api/chat/conversations", { method: "GET" });
}

export async function fetchMessages(
  conversationId: string, 
  cursor?: string, 
  direction: "before" | "after" = "before"
): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (cursor) params.append("cursor", cursor);
  params.append("direction", direction);
  params.append("limit", "50");

  return apiFetch<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages?${params.toString()}`, { 
    method: "GET" 
  });
}

// Fetch a single message by ID (used when receiving socket payload)
export async function fetchMessageById(conversationId: string, messageId: number): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`/api/chat/conversations/${conversationId}/messages/${messageId}`, { 
    method: "GET" 
  });
}

// 1. Fetch the signature from your backend
async function getUploadSignature(): Promise<{
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}> {
  return apiFetch(`/api/chat/upload-signature`, { method: "GET" });
}

// 2. Upload the file binary directly to Cloudinary
export async function uploadAttachment(file: File): Promise<{ url: string; mime_type: string; size: number; width?: number; height?: number; duration?: number }> {
  // Step A: Get the signed payload from Express
  const { signature, timestamp, folder, apiKey, cloudName } = await getUploadSignature();

  // Step B: Construct the FormData for Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  // Step C: POST directly to Cloudinary (Bypassing your Express server completely)
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  
  const response = await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Cloudinary upload failed:", errorData);
    throw new Error("Failed to upload attachment to Cloudinary");
  }

  const data = await response.json();

  // Return the standardized format your chat schema expects
  return {
    url: data.secure_url,
    mime_type: data.resource_type === "image" ? "image/*" : data.format, // Adjust based on Cloudinary response
    size: data.bytes,
    width: data.width,
    height: data.height,
    duration: data.duration || null,
  };
}

export async function createConversation(listingId: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ listingId }),
  });
}


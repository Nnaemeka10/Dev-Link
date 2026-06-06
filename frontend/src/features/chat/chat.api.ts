import { ChatMessage, ChatThread } from "./chat.types";
import { MOCK_MESSAGES, MOCK_THREADS } from "./chat.data";

// Replace these with actual fetch/axios calls in the future.
// Returning the mock data for now.

export async function fetchThreads(): Promise<ChatThread[]> {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_THREADS), 500);
  });
}

export async function fetchThreadMessages(threadId: string): Promise<ChatMessage[]> {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_MESSAGES[threadId] || []), 500);
  });
}

export async function sendMessageApi(threadId: string, content: string, attachments?: File[]): Promise<ChatMessage> {
  // Simulate network upload
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `msg_${Date.now()}`,
        threadId,
        senderId: "current_user", // This would come from auth context
        content,
        createdAt: new Date().toISOString(),
        status: "sent",
        // handle attachments mocking here if needed
      });
    }, 600);
  });
}

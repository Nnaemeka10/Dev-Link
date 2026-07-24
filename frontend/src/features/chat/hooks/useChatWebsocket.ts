import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { fetchMessages, fetchMessageById } from "../chat.api";
import type { ChatAttachment, ChatMessage, SocketMessagePayload } from "../chat.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface UseChatSocketProps {
  userId: number | undefined;
  activeThreadId: string | null;
  onMessageReceived: (conversationId: string, message: ChatMessage) => void;
  onTyping: (conversationId: string, isTyping: boolean) => void;
}

export function useChatSocket({ userId, activeThreadId, onMessageReceived, onTyping }: UseChatSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const lastSeqRef = useRef<Record<string, number>>({}); // Tracks last received seq per conversation

  useEffect(() => {
    if (!userId) return;

    // Connect and authenticate via cookie
    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(" Socket connected");
      
      // ─── Reconnection Catch-Up Logic ─────────────────────────────────────
      // When connecting, check all known conversations for missed messages
      Object.keys(lastSeqRef.current).forEach(async (convId) => {
        const lastSeq = lastSeqRef.current[convId];
        try {
          // Fetch all messages that occurred after our last known sequence
          const missedMessages = await fetchMessages(convId, String(lastSeq), "after");
          missedMessages.forEach(msg => {
            onMessageReceived(convId, msg);
            lastSeqRef.current[convId] = Math.max(lastSeqRef.current[convId], msg.conversation_seq);
          });
        } catch (error) {
          console.error("Catch-up fetch failed:", error);
        }
      });
    });

    socket.on("message.created", async (payload: SocketMessagePayload) => {
      // The backend LISTEN/NOTIFY only sends IDs. We must fetch the full message.
      try {
        const message = await fetchMessageById(payload.conversation_id, payload.message_id);
        onMessageReceived(payload.conversation_id, message);
        lastSeqRef.current[payload.conversation_id] = Math.max(
          lastSeqRef.current[payload.conversation_id] || 0, 
          message.conversation_seq
        );
      } catch (error) {
        console.error("Failed to fetch message details:", error);
      }
    });

    socket.on("message:read", (data: { conversationId: string, readerId: number, readUpToSeq: number }) => {
      // Update message statuses in cache to "read"
      queryClient.setQueryData<ChatMessage[]>(["chat", "messages", data.conversationId], (old = []) => 
        old.map(msg => msg.conversation_seq <= data.readUpToSeq ? { ...msg, status: "read" } : msg)
      );
    });

    socket.on("typing:start", (data: { userId: number, conversationId: string }) => onTyping(data.conversationId, true));
    socket.on("typing:stop", (data: { userId: number, conversationId: string }) => onTyping(data.conversationId, false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, queryClient, onMessageReceived, onTyping]);

  // ─── Join/Leave Room when active thread changes ───────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeThreadId) return;

    // Initialize lastSeq for this thread if not exists
    if (!lastSeqRef.current[activeThreadId]) {
      // If we have messages in cache, use the highest seq. Otherwise 0.
      const cachedMessages = queryClient.getQueryData<ChatMessage[]>(["chat", "messages", activeThreadId]);
      lastSeqRef.current[activeThreadId] = cachedMessages?.length ? Math.max(...cachedMessages.map(m => m.conversation_seq)) : 0;
    }

    socket.emit("conversation:join", activeThreadId, (success: boolean) => {
      if (success) console.log(`Joined room: ${activeThreadId}`);
      else console.error(`Failed to join room: ${activeThreadId}`);
    });

    return () => {
      socket.emit("conversation:leave", activeThreadId); // Optional: backend can handle disconnect
    };
  }, [activeThreadId, queryClient]);

  // Expose emit functions
  const emitSendMessage = (
    payload: { 
      conversationId: string; 
      body: string; 
      clientId: string; 
      type: "text" | "image" | "file";
      attachments?: ChatAttachment[] 
    }, 
    callback: (message: ChatMessage | null, error?: string) => void
  ) => {
    socketRef.current?.emit("message:send", payload, callback);
  };

  const emitMarkAsRead = (conversationId: string, messageSeq: number) => {
    socketRef.current?.emit("conversation:read", { conversationId, messageSeq });
  };

  const emitTyping = (conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit(isTyping ? "typing:start" : "typing:stop", conversationId);
  };

  return { emitSendMessage, emitMarkAsRead, emitTyping };
}
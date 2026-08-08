import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchConversations, fetchMessages, uploadAttachment } from "../chat.api";
import { useChatSocket } from "./useChatWebsocket";
import { useCallback, useState } from "react";
import type { ChatMessage, ChatAttachment, AttachmentType } from "../chat.types";

export function useChat(userId: number | undefined) {
  const queryClient = useQueryClient();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  // 1. Fetch Conversations
  const { data: conversations = [], isLoading: isLoadingThreads } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: fetchConversations,
    enabled: !!userId,
  });

  // 2. Fetch Active Thread Messages
  const { data: activeMessages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat", "messages", activeThreadId],
    queryFn: () => activeThreadId ? fetchMessages(activeThreadId) : Promise.resolve([]),
    enabled: !!activeThreadId,
  });

   // Helper to infer attachment type from mime_type
  const inferAttachmentType = (mimeType: string): AttachmentType => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "document";
  };

  // 3. Socket.IO Integration (Handles real-time updates & cache invalidation)
  const {emitSendMessage, emitTyping} = useChatSocket({
    userId,
    activeThreadId,
    onMessageReceived: (conversationId, message) => {
      // If the message belongs to the active thread, append it to the cache
      if (conversationId === activeThreadId) {
        queryClient.setQueryData<ChatMessage[]>(["chat", "messages", conversationId], (old = []) => {
          // Prevent duplicates (idempotency safety net)
          if (old.some(m => m.id === message.id)) return old;

          //If we have an optimistic message with this client_id, replace it
          if (message.client_id && old.some(m => m.client_id === message.client_id)) {
            return old.map(m => m.client_id === message.client_id ? { ...message, status: "sent" } : m);
          }
          
          return [...old, message];
        });
      }
      // Always invalidate conversations list to update last_message preview & unread count
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
    onTyping: (conversationId, isTyping) => {
      if (conversationId === activeThreadId) {
        setTypingUsers(prev => ({ ...prev, [conversationId]: isTyping }));
      }
    }
  });

  

 

   const [isSending, setIsSending] = useState(false);

  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!activeThreadId || !userId) return;


      const clientId = crypto.randomUUID();

      let attachments: ChatAttachment[] = [] ;
      if (files?.length) {
        const uploaded = await Promise.all(files.map((file) => uploadAttachment(file)));
        attachments = uploaded.map((att, i) => ({
          id: `temp-${Date.now()}-${i}`,
          type: inferAttachmentType(att.mime_type),
          ...att,
        }));
      }

      const optimisticMessage: ChatMessage = {
        id: Date.now(),
        conversation_id: activeThreadId,
        sender_id: userId,
        conversation_seq: Date.now(),
        client_id: clientId,
        type: "text",
        body: content,
        created_at: new Date().toISOString(),
        status: "sending",
        attachments,
      };

      queryClient.setQueryData<ChatMessage[]>(
        ["chat", "messages", activeThreadId],
        (old = []) => [...old, optimisticMessage]
      );

      emitSendMessage(
        {
          conversationId: activeThreadId,
          clientId,
          type: "text",
          body: content,
          attachments,
        },
        (serverMessage, error) => {
          if (error || !serverMessage) {
            queryClient.setQueryData<ChatMessage[]>(
              ["chat", "messages", activeThreadId],
              (old = []) =>
                old.map((msg) =>
                  msg.client_id === clientId
                    ? { ...msg, status: "failed" }
                    : msg
                )
            );
            return;
          }

          queryClient.setQueryData<ChatMessage[]>(
            ["chat", "messages", activeThreadId],
            (old = []) =>
              old.map((msg) =>
                msg.client_id === clientId
                  ? { ...serverMessage, status: "sent" }
                  : msg
              )
          );

          queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
        }
      );

      return clientId;
    },
    [activeThreadId, userId, queryClient, emitSendMessage]
  );

  const handleTyping = useCallback(
  (isTyping: boolean) => {
    if (!activeThreadId) return;
    emitTyping(activeThreadId, isTyping);
  },
  [activeThreadId, emitTyping]
);

  return {
    conversations,
    activeThreadId,
    activeMessages,
    isLoadingThreads,
    isLoadingMessages,
    isSending,
    setActiveThreadId,
    handleSendMessage,
    handleTyping,
    typingStatus: activeThreadId ? typingUsers[activeThreadId] : false,
  };

  
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchConversations, fetchMessages, uploadAttachment } from "../chat.api";
import { useChatSocket } from "./useChatWebsocket";
import { useCallback, useState } from "react";
import type { ChatMessage, ChatAttachment } from "../chat.types";

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

  // 3. Socket.IO Integration (Handles real-time updates & cache invalidation)
  const {emitSendMessage, emitTyping} = useChatSocket({
    userId,
    activeThreadId,
    onMessageReceived: (conversationId, message) => {
      // If the message belongs to the active thread, append it to the cache
      if (conversationId === activeThreadId) {
        queryClient.setQueryData<ChatMessage[]>(["chat", "messages", conversationId], (old = []) => {
          // Prevent duplicates (idempotency safety net)
          if (old.some(m => m.id === message.id || (m.client_id && m.client_id === message.client_id))) {
            return old;
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

  // 4. Send Message Mutation (Optimistic UI)
  const { mutateAsync: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (params: { 
      conversationId: string; 
      content: string; 
      clientId: string; 
      files?: File[] 
    }) => {
      // Upload attachments first if any
      let attachments = [];
      if (params.files && params.files.length > 0) {
        attachments = await Promise.all(params.files.map(f => uploadAttachment(f)));
      }
      
      // The actual socket emission is handled inside the component to get the ack callback,
      // but for React Query state, we handle the optimistic update here.
      return params;
    },
    onMutate: async (params) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["chat", "messages", params.conversationId] });

      // Optimistically add the message to the cache
      const tempMessage: ChatMessage = {
        id: Date.now(), // Temp ID
        conversation_id: params.conversationId,
        sender_id: userId!,
        conversation_seq: Date.now(), // Temp seq
        client_id: params.clientId,
        type: "text",
        body: params.content,
        created_at: new Date().toISOString(),
        status: "sending",
        attachments: []
      };

      queryClient.setQueryData<ChatMessage[]>(["chat", "messages", params.conversationId], (old = []) => [...old, tempMessage]);

      return { tempMessage };
    },
    onError: (err, params, context) => {
      // Rollback on error
      if (context?.tempMessage) {
        queryClient.setQueryData<ChatMessage[]>(["chat", "messages", params.conversationId], (old = []) => 
          old.filter(m => m.id !== context.tempMessage.id)
        );
      }
    }
  });

  // const handleSendMessage = useCallback(async (content: string, files?: File[]) => {
  //   if (!activeThreadId || !userId) return;
  //   const clientId = crypto.randomUUID(); // Idempotency key
  //   await sendMessage({ conversationId: activeThreadId, content, clientId, files });
    
  //   // The actual socket.emit("message:send") is triggered in the component to handle the ack
  //   // For simplicity in this hook, we return the clientId so the component can use it
  //   return clientId;
  // }, [activeThreadId, userId, sendMessage]);

  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!activeThreadId || !userId) return;

      const clientId = crypto.randomUUID();

      let attachments = [] ;
      if (files?.length) {
        attachments = await Promise.all(files.map((file) => uploadAttachment(file)));
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
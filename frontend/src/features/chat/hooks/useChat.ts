import { useQuery, useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useChatStore } from "../store/chat.store";
import { fetchThreads, fetchThreadMessages, sendMessageApi } from "../chat.api";
import { ChatMessage } from "../chat.types";

export function useChat() {
  const activeThreadId = useChatStore((state) => state.activeThreadId);
  const setActiveThread = useChatStore((state) => state.setActiveThread);
  const addMessage = useChatStore((state) => state.addMessage);

  // Queries
  const { data: threads, isLoading: isLoadingThreads } = useQuery({
    queryKey: ["chat", "threads"],
    queryFn: fetchThreads,
  });

  const { data: activeThreadMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat", "messages", activeThreadId],
    queryFn: () => (activeThreadId ? fetchThreadMessages(activeThreadId) : Promise.resolve([])),
    enabled: !!activeThreadId,
  });

  // Mutations
  const { mutateAsync: sendMessageRaw, isPending: isSending } = useMutation({
    mutationFn: (params: { threadId: string; content: string; files?: File[] }) =>
      sendMessageApi(params.threadId, params.content, params.files),
    onSuccess: (newMessage, variables) => {
      // Optimistic update would normally happen in onMutate, 
      // but caching it locally in the store on success is also common
      addMessage(variables.threadId, newMessage);
    },
  });

  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!activeThreadId) return;
      await sendMessageRaw({ threadId: activeThreadId, content, files });
    },
    [activeThreadId, sendMessageRaw]
  );

  return {
    threads,
    activeThreadId,
    activeThreadMessages,
    isLoadingThreads,
    isLoadingMessages,
    isSending,
    setActiveThread,
    sendMessage,
  };
}

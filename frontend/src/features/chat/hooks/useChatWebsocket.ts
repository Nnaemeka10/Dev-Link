import { useEffect, useRef } from "react";
import { useChatStore } from "../store/chat.store";
import { ChatMessage } from "../chat.types";

/**
 * Hook to manage WebSocket connection for real-time messaging, typing indicators, and read receipts.
 */
export function useChatWebsocket(userId?: string) {
  const ws = useRef<WebSocket | null>(null);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessageStatus = useChatStore((state) => state.updateMessageStatus);
  const setTypingStatus = useChatStore((state) => state.setTypingStatus);

  useEffect(() => {
    if (!userId) return;

    // Connect to WebSocket server
    // ws.current = new WebSocket(`wss://your-api-url/ws/chat?userId=${userId}`);

    // ws.current.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //
    //   switch (data.type) {
    //     case "NEW_MESSAGE":
    //       addMessage(data.payload.threadId, data.payload.message);
    //       break;
    //     case "MESSAGE_STATUS_UPDATE":
    //       updateMessageStatus(data.payload.threadId, data.payload.messageId, data.payload.status);
    //       break;
    //     case "TYPING_INDICATOR":
    //       setTypingStatus(data.payload.threadId, data.payload.isTyping);
    //       break;
    //   }
    // };

    return () => {
      // ws.current?.close();
    };
  }, [userId, addMessage, updateMessageStatus, setTypingStatus]);

  const sendTypingIndicator = (threadId: string, isTyping: boolean) => {
    // ws.current?.send(JSON.stringify({ type: "TYPING", payload: { threadId, isTyping } }));
  };

  const markAsRead = (threadId: string, messageId: string) => {
    // ws.current?.send(JSON.stringify({ type: "MARK_READ", payload: { threadId, messageId } }));
  };

  return {
    sendTypingIndicator,
    markAsRead,
  };
}

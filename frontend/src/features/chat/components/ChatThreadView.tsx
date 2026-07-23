
import React, { useEffect, useRef } from "react";
import { ChatMessage } from "../chat.types";
import { MessageBubble } from "./MessageBubble";

interface ChatThreadViewProps {
  messages: ChatMessage[];
  currentUserId: number;
  isTyping?: boolean;
}

export function ChatThreadView({ messages, currentUserId, isTyping }: ChatThreadViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-gray-500">
        <p>No messages in this conversation yet.<br/>Send a message to start!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} isMine={message.sender_id === currentUserId} />
      ))}
      {isTyping && (
        <div className="flex items-center gap-2 self-start text-sm text-gray-500">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></span>
          </div>
          Someone is typing...
        </div>
      )}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
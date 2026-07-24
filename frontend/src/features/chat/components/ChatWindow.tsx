"use client";

import { useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import type { ChatMessage, ChatThread } from "../chat.types";
import { getConversationName } from "../utils";

interface ChatWindowProps {
  conversation: ChatThread | null;
  messages: ChatMessage[];
  currentUserId: number;
  isTyping?: boolean;
  isSending?: boolean;
  onSendMessage: (content: string, files?: File[]) => Promise<string | undefined>;
  onTyping: (isTyping: boolean) => void;
  onBack?: () => void;
}

export function ChatWindow({ conversation, messages, currentUserId, isTyping, isSending, onSendMessage, onTyping, onBack }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayName = getConversationName(conversation);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) return <EmptyState />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 mr-1" aria-label="Back to conversations">
              {/* Back Arrow Icon */}
            </button>
          )}
          <Avatar name={displayName} avatarUrl={conversation.avatarUrl} isOnline={conversation.isOnline} size="sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{displayName}</p>
            <p className={`text-xs leading-tight ${conversation.isOnline ? "text-green-600" : "text-gray-400"}`}>
              {conversation.isOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isMine={msg.sender_id === currentUserId} senderName={conversation.name} senderAvatar={conversation.avatarUrl} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2.5 max-w-[80%]">
            <Avatar name={conversation.name} avatarUrl={conversation.avatarUrl} size="sm" />
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSendMessage={onSendMessage} onTyping={onTyping} isSending={isSending} />
    </div>
  );
}
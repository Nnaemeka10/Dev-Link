"use client";

import { useState, useRef } from "react";

interface ChatInputProps {
  onSendMessage: (content: string, files?: File[]) => Promise<string | undefined>;
  onTyping: (isTyping: boolean) => void;
  isSending?: boolean;
}

export function ChatInput({ onSendMessage, onTyping, isSending }: ChatInputProps) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (val: string) => {
    setText(val);
    if (val.length > 0) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
    } else {
      onTyping(false);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText("");
    onTyping(false);
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3.5 bg-white border-t border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2">
        <button className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
          {/* Paperclip Icon */}
        </button>
        <input
          type="text" value={text} onChange={(e) => handleTyping(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Message..." disabled={isSending}
          className="flex-1 bg-transparent border-0 focus:outline-none text-sm text-gray-800 placeholder:text-gray-400 py-1"
        />
        <button onClick={handleSend} disabled={!text.trim() || isSending} className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
          {/* Send Icon */}
        </button>
      </div>
    </div>
  );
}
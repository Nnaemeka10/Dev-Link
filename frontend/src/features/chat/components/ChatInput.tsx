import React, { useState } from "react";
import { Paperclip, Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string, files?: File[]) => void;
  isSending?: boolean;
}

export function ChatInput({ onSendMessage, isSending }: ChatInputProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;
    
    onSendMessage(content.trim());
    setContent("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t bg-white p-4"
    >
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <Paperclip className="h-5 w-5" />
      </button>

      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-full border-gray-300 bg-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        disabled={isSending}
      />

      <button
        type="submit"
        disabled={!content.trim() || isSending}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d65c3a] text-white disabled:bg-gray-300"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}

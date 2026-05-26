import React from "react";
import { ChatThread } from "../chat.types";

interface ChatListProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  isLoading: boolean;
}

export function ChatList({ threads, activeThreadId, onSelectThread, isLoading }: ChatListProps) {
  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading chats...</div>;
  }

  if (threads.length === 0) {
    return <div className="p-4 text-sm text-gray-500">No active conversations.</div>;
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelectThread(thread.id)}
          className={`flex flex-col gap-1 border-b p-4 text-left transition-colors ${
            activeThreadId === thread.id ? "bg-blue-50" : "hover:bg-gray-50"
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span className="font-semibold text-gray-900">
              {thread.participantIds.join(", ")}
            </span>
            <span className="text-xs text-gray-400">
              {thread.updatedAt && new Date(thread.updatedAt).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="flex w-full items-center justify-between">
            <p className="line-clamp-1 text-sm text-gray-500">
              {thread.lastMessage?.content || "No messages yet"}
            </p>
            {thread.unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {thread.unreadCount}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

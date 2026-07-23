"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import type { ChatThread } from "../chat.types";

interface ConversationListProps {
  conversations: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("");

  const getConversationName = (c: ChatThread) => {
    if (c.context_type === 'support') return "EventVnV Support";
    if (c.participant_first_name) return `${c.participant_first_name} ${c.participant_last_name || ''}`;
    return c.listing_title || "Direct Chat";
  };
  const filtered = conversations.filter((c) => getConversationName(c).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Messages</h2>
        </div>
        <div className="relative">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages"
            className="w-full bg-gray-100 border-0 rounded-xl py-2.5 pl-4 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {filtered.length > 0 ? (
          filtered.map((c) => (
            <button
              key={c.id} onClick={() => onSelect(c.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors ${
                activeId === c.id ? "bg-orange-50 border border-orange-100" : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <Avatar name={getConversationName(c)} avatarUrl={c.avatarUrl} isOnline={c.isOnline} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm truncate ${activeId === c.id ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                    {getConversationName(c)}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {c.updated_at && new Date(c.updated_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 truncate">
                    {c.last_message?.type === 'system' ? <span className="italic text-gray-400">System Message</span> : c.last_message?.body || "No messages yet"}</p>
                  {c.unread_count > 0 && <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />}
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="text-center text-sm text-gray-400 mt-10">No conversations found</p>
        )}
      </div>
    </div>
  );
}
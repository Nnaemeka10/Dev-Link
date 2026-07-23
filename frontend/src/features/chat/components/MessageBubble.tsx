"use client";

import { Avatar } from "./Avatar";
import type { ChatMessage } from "../chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export function MessageBubble({ message, isMine, senderName, senderAvatar }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

   if (message.type === "system") {
    return (
      <div className="flex justify-center my-4">
        <div className="max-w-[90%] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {message.attachments && message.attachments.length > 0 && (
            <img src={message.attachments[0].url} alt="Context" className="w-full h-32 object-cover" />
          )}
          <div className="p-4 text-center">
            <p className="text-sm font-semibold text-gray-800">{message.body}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">{time}</span>
          </div>
        </div>
      </div>
    );
  }

  if (isMine) {
    return (
      <div className="flex flex-row-reverse items-end gap-2.5 max-w-[80%] ml-auto">
        <div className="flex flex-col items-end">
          <div className="bg-orange-500 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed">{message.body}</p>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block mr-1">
            {time}
            {message.status === "read" && " · Read"}
            {message.status === "delivered" && " · Delivered"}
            {message.status === "sending" && " · Sending..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2.5 max-w-[80%]">
      <Avatar name={senderName} avatarUrl={senderAvatar} size="sm" />
      <div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed">{message.body}</p>
        </div>
        <span className="text-[11px] text-gray-400 mt-1 block ml-1">{time}</span>
      </div>
    </div>
  );
}
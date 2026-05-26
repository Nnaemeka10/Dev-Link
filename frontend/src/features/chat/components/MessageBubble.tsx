import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { ChatMessage } from "../chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div
      className={`flex max-w-[75%] flex-col gap-1 ${
        isMine ? "self-end" : "self-start"
      }`}
    >
      <div
        className={`rounded-2xl px-4 py-2 ${
          isMine
            ? "rounded-tr-sm bg-[#d65c3a] text-white"
            : "rounded-tl-sm bg-gray-100 text-gray-900"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        
        {/* Render Attachments Placeholder */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <div key={att.id} className="h-20 w-20 overflow-hidden rounded bg-black/10">
                {att.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.url} alt={att.fileName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs">
                    {att.fileName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`flex items-center gap-1 text-[10px] text-gray-400 ${
          isMine ? "justify-end" : "justify-start"
        }`}
      >
        <span>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        
        {isMine && (
          <span className="ml-1">
            {message.status === "sent" && <Check className="h-3 w-3" />}
            {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
            {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
          </span>
        )}
      </div>
    </div>
  );
}

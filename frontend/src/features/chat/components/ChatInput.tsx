"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { CHAT_LIMITS, type ChatMessage } from "../chat.types";
import { formatBytes, messagePreviewText } from "../utils";
import { validateFile } from "../chat.api";
import type { SendInput } from "../hooks/useChat";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const MAX_TEXTAREA_PX = 132;

const ACCEPT = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv", "application/zip",
  "audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/webm",
  "video/mp4", "video/quicktime", "video/webm",
].join(",");

interface ChatInputProps {
  onSend: (input: SendInput) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  isSending?: boolean;
  disabled?: boolean;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  replyLabel?: string;
  warning?: string | null;
  onDismissWarning?: () => void;
  sendError?: string | null;
  onClearSendError?: () => void;
}

interface StagedFile {
  id: string;
  file: File;
  preview: string | null;
}

export function ChatInput({
  onSend,
  onTyping,
  isSending = false,
  disabled = false,
  replyTo,
  onCancelReply,
  replyLabel = "them",
  warning,
  onDismissWarning,
  sendError,
  onClearSendError,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stagedRef = useRef<StagedFile[]>([]);

  useEffect(() => {
    stagedRef.current = staged;
  }, [staged]);

  // Revoke object URLs on unmount so previews never leak.
  useEffect(
    () => () => {
      for (const item of stagedRef.current) {
        if (item.preview) URL.revokeObjectURL(item.preview);
      }
    },
    []
  );

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, [text]);

  // A reply target focuses the composer - the user is mid-action.
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    setLocalError(null);

    const room = CHAT_LIMITS.MAX_ATTACHMENTS - staged.length;
    if (room <= 0) {
      setLocalError(`Up to ${CHAT_LIMITS.MAX_ATTACHMENTS} attachments per message.`);
      return;
    }

    const accepted: StagedFile[] = [];
    for (const file of incoming.slice(0, room)) {
      const problem = validateFile(file);
      if (problem) {
        setLocalError(problem);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      });
    }
    if (incoming.length > room) {
      setLocalError(`Only ${room} more attachment${room === 1 ? "" : "s"} allowed.`);
    }
    if (accepted.length > 0) setStaged((current) => [...current, ...accepted]);
  }

  function removeStaged(id: string) {
    setStaged((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.id !== id);
    });
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (disabled || isSending) return;
    if (!trimmed && staged.length === 0) return;
    if (trimmed.length > CHAT_LIMITS.MAX_BODY) {
      setLocalError(`Messages are limited to ${CHAT_LIMITS.MAX_BODY} characters.`);
      return;
    }

    const files = staged.map((item) => item.file);
    setText("");
    setStaged([]);
    setLocalError(null);
    onClearSendError?.();
    onTyping(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    await onSend({ body: trimmed, files, replyTo });
    onCancelReply();
    textareaRef.current?.focus();
  }

  const canSend = !disabled && !isSending && (text.trim().length > 0 || staged.length > 0);
  const overLimit = text.length > CHAT_LIMITS.MAX_BODY;
  const error = localError ?? sendError;

  return (
    <div
      className={`shrink-0 border-t border-[#F0E9DF] bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-4 ${
        dragOver ? "ring-2 ring-inset ring-[#B9401D]/40" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
      }}
    >
      {/* Escrow safety nudge - never blocks sending */}
      <AnimatePresence initial={false}>
        {warning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mb-2.5 flex items-start gap-2.5 rounded-2xl bg-[#FFF7F2] px-3.5 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
              <p className="flex-1 text-[11px] font-semibold leading-5 text-[#8A5A44]">{warning}</p>
              <button
                type="button"
                onClick={onDismissWarning}
                aria-label="Dismiss"
                className="shrink-0 text-[#B9401D]/60 hover:text-[#B9401D]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="mb-2.5 rounded-2xl bg-red-50 px-3.5 py-2.5 text-[11px] font-bold text-red-700">
          {error}
        </p>
      )}

      {/* Reply preview */}
      <AnimatePresence initial={false}>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mb-2.5 flex items-start gap-2.5 rounded-2xl border-l-[3px] border-[#B9401D] bg-[#F7F2EA] px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#B9401D]">
                  Replying to {replyLabel}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-[#6B5F57]">
                  {messagePreviewText(replyTo) || "Attachment"}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancelReply}
                aria-label="Cancel reply"
                className="shrink-0 text-[#9A9AAE] transition-colors hover:text-[#252423]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staged attachments */}
      {staged.length > 0 && (
        <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1">
          {staged.map((item) => (
            <div
              key={item.id}
              className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#F0E9DF] bg-[#F7F2EA]"
            >
              {item.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="px-1 text-center">
                  <FileText className="mx-auto h-5 w-5 text-[#B9401D]" aria-hidden="true" />
                  <span className="mt-0.5 block truncate text-[9px] font-bold text-[#6B5F57]">
                    {formatBytes(item.file.size)}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeStaged(item.id)}
                aria-label={`Remove ${item.file.name}`}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-3xl border border-[#F0E9DF] bg-[#F7F2EA] px-2.5 py-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          aria-label="Attach a file"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#9A9AAE] transition-colors hover:bg-white hover:text-[#B9401D] disabled:opacity-40"
        >
          <Paperclip className="h-5 w-5" aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          disabled={disabled}
          placeholder={disabled ? "Reconnecting…" : "Message…"}
          onChange={(event) => {
            setText(event.target.value);
            onTyping(event.target.value.trim().length > 0);
          }}
          onBlur={() => onTyping(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          onPaste={(event) => {
            const files = Array.from(event.clipboardData.files ?? []);
            if (files.length > 0) {
              event.preventDefault();
              addFiles(files);
            }
          }}
          className="max-h-33 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-sm font-medium text-[#252423] outline-none placeholder:text-[#B69F98] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        />

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend || overLimit}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B9401D] text-white transition-all hover:brightness-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold text-[#C4BBAE]">
          Enter to send · Shift + Enter for a new line
        </span>
        {text.length > CHAT_LIMITS.MAX_BODY - 400 && (
          <span className={`text-[10px] font-bold ${overLimit ? "text-red-600" : "text-[#9A9AAE]"}`}>
            {text.length}/{CHAT_LIMITS.MAX_BODY}
          </span>
        )}
      </div>
    </div>
  );
}
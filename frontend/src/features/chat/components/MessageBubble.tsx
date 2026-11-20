"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock3,
  Copy,
  CornerUpLeft,
  Download,
  FileText,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { CHAT_LIMITS, isPendingMessage, type ChatAttachment, type ChatMessage } from "../chat.types";
import {
  canDeleteMessage,
  canEditMessage,
  canReplyToMessage,
  formatBytes,
  formatMessageTime,
  isImageAttachment,
  messagePreviewText,
} from "../utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SWIPE_TRIGGER_PX = 56;

export type ReceiptState = "sent" | "delivered" | "read";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  currentUserId: number;
  senderName?: string | null;
  senderAvatar?: string | null;
  /** Support threads have several agents - show who spoke on run starts. */
  showSender: boolean;
  startsRun: boolean;
  endsRun: boolean;
  receiptState?: ReceiptState;
  onReply: (message: ChatMessage) => void;
  onEdit: (messageId: number, body: string) => Promise<void>;
  onDelete: (messageId: number) => Promise<void>;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
  onJumpToMessage?: (messageId: number) => void;
}

function ReceiptTicks({ state }: { state: ReceiptState }) {
  if (state === "read") return <CheckCheck className="h-3.5 w-3.5 text-[#7FD1A8]" aria-label="Read" />;
  if (state === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-white/60" aria-label="Delivered" />;
  return <Check className="h-3.5 w-3.5 text-white/60" aria-label="Sent" />;
}

function AttachmentGrid({
  attachments,
  onOpen,
}: {
  attachments: ChatAttachment[];
  onOpen: (attachment: ChatAttachment) => void;
}) {
  const images = attachments.filter(isImageAttachment);
  const files = attachments.filter((a) => !isImageAttachment(a));

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className={`grid gap-1.5 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {images.map((attachment) => (
            <button
              key={attachment.id}
              type="button"
              onClick={() => onOpen(attachment)}
              className="group relative aspect-4/3 overflow-hidden rounded-xl bg-black/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.local_url || attachment.url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {attachment.progress != null && attachment.progress < 100 && (
                <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span className="mt-1 text-[11px] font-bold">{attachment.progress}%</span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {files.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center gap-3 rounded-xl bg-black/5 px-3 py-2.5 transition-colors hover:bg-black/10"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 text-[#B9401D]">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold">
              {attachment.url ? attachment.url.split("/").pop()?.split("?")[0] : "File"}
            </span>
            <span className="block text-[10px] font-semibold opacity-70">
              {formatBytes(attachment.size)}
              {attachment.progress != null && attachment.progress < 100 ? ` · ${attachment.progress}%` : ""}
            </span>
          </span>
          <Download className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export function MessageBubble({
  message,
  isMine,
  currentUserId,
  senderName,
  senderAvatar,
  showSender,
  startsRun,
  endsRun,
  receiptState = "sent",
  onReply,
  onEdit,
  onDelete,
  onRetry,
  onDiscard,
  onJumpToMessage,
}: MessageBubbleProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body ?? "");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<ChatAttachment | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const longPressRef = useRef<number | undefined>(undefined);

  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [0, SWIPE_TRIGGER_PX], [0, 1]);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => () => window.clearTimeout(longPressRef.current), []);

  const pending = isPendingMessage(message);
  const failed = message.status === "failed";
  const deleted = !!message.deleted_at;
  const editable = canEditMessage(message, currentUserId);
  const deletable = canDeleteMessage(message, currentUserId);
  const replyable = canReplyToMessage(message);

  // ── System message: centred, never attributed ────────────────────────────
  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2">
        <div className="max-w-[92%] overflow-hidden rounded-2xl border border-[#F0E9DF] bg-white shadow-[0_6px_18px_rgba(36,28,18,0.05)]">
          {message.attachments?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={message.attachments[0].url} alt="" className="h-28 w-full object-cover" />
          )}
          <div className="px-4 py-3 text-center">
            <p className="text-sm font-bold leading-6 text-[#252423]">{message.body}</p>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[#C4BBAE]">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  async function submitEdit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === (message.body ?? "")) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await onEdit(message.id, trimmed);
      setEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't save the edit.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDelete() {
    setBusy(true);
    setActionError(null);
    try {
      await onDelete(message.id);
      setConfirmDelete(false);
      setActionsOpen(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't delete the message.");
    } finally {
      setBusy(false);
    }
  }

  const bubbleTone = isMine
    ? "bg-[#B9401D] text-white"
    : "border border-[#F0E9DF] bg-white text-[#252423]";

  const radius = isMine
    ? `rounded-2xl ${startsRun ? "rounded-tr-md" : ""} ${endsRun ? "rounded-br-sm" : ""}`
    : `rounded-2xl ${startsRun ? "rounded-tl-md" : ""} ${endsRun ? "rounded-bl-sm" : ""}`;

  const body = (
    <div className={`min-w-0 ${isMine ? "items-end" : "items-start"} flex flex-col`}>
      {showSender && !isMine && startsRun && (
        <span className="mb-1 ml-1 text-[11px] font-extrabold text-[#B9401D]">
          {senderName || "Guest"}
        </span>
      )}

      <div className={`relative max-w-full px-4 py-3 shadow-[0_4px_14px_rgba(36,28,18,0.05)] ${radius} ${bubbleTone} ${failed ? "ring-2 ring-red-400" : ""} ${pending ? "opacity-80" : ""}`}>
        {/* Quoted reply */}
        {message.reply_preview && (
          <button
            type="button"
            onClick={() => onJumpToMessage?.(message.reply_preview!.id)}
            className={`mb-2 block w-full rounded-lg border-l-[3px] px-2.5 py-1.5 text-left ${
              isMine ? "border-white/60 bg-white/12" : "border-[#B9401D] bg-[#F7F2EA]"
            }`}
          >
            <span className={`block text-[10px] font-extrabold ${isMine ? "text-white/80" : "text-[#B9401D]"}`}>
              {Number(message.reply_preview.sender_id) === Number(currentUserId)
                ? "You"
                : message.reply_preview.sender_name}
            </span>
            <span className="mt-0.5 line-clamp-2 block text-[11px] font-semibold opacity-80">
              {message.reply_preview.deleted
                ? "Message deleted"
                : message.reply_preview.body ||
                  (message.reply_preview.has_attachments ? "Attachment" : "Message")}
            </span>
          </button>
        )}

        {deleted ? (
          <p className="text-sm font-semibold italic opacity-60">This message was deleted</p>
        ) : editing ? (
          <div className="w-64 max-w-full">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={CHAT_LIMITS.MAX_BODY}
              autoFocus
              className={`w-full resize-none rounded-lg px-2.5 py-2 text-sm font-medium outline-none ${
                isMine ? "bg-white/15 text-white placeholder:text-white/50" : "bg-[#F7F2EA] text-[#252423]"
              }`}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditing(false); setDraft(message.body ?? ""); }}
                className="rounded-full px-3 py-1.5 text-[11px] font-bold opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={busy || !draft.trim()}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-extrabold disabled:opacity-50 ${
                  isMine ? "bg-white text-[#B9401D]" : "bg-[#B9401D] text-white"
                }`}
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.attachments?.length > 0 && (
              <div className={message.body ? "mb-2" : ""}>
                <AttachmentGrid attachments={message.attachments} onOpen={setLightbox} />
              </div>
            )}
            {message.body && (
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed md:text-[15px]">
                {message.body}
              </p>
            )}
          </>
        )}

        {/* Meta row */}
        <div className={`mt-1.5 flex items-center gap-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
          {message.edited_at && !deleted && (
            <span className="text-[10px] font-semibold opacity-60">edited</span>
          )}
          <span className="text-[10px] font-semibold opacity-60">
            {formatMessageTime(message.created_at)}
          </span>
          {isMine && !deleted && (
            <>
              {pending ? (
                failed ? (
                  <span className="text-[10px] font-extrabold text-red-200">Failed</span>
                ) : (
                  <Clock3 className="h-3 w-3 animate-pulse text-white/60" aria-label="Sending" />
                )
              ) : (
                <ReceiptTicks state={receiptState} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Failure controls */}
      {failed && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-red-600">{message.error}</span>
          <button
            type="button"
            onClick={() => message.client_id && onRetry(message.client_id)}
            className="inline-flex items-center gap-1 rounded-full bg-[#B9401D] px-2.5 py-1 text-[10px] font-extrabold text-white"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" /> Retry
          </button>
          <button
            type="button"
            onClick={() => message.client_id && onDiscard(message.client_id)}
            className="rounded-full border border-[#E8DDD2] px-2.5 py-1 text-[10px] font-extrabold text-[#6B5F57]"
          >
            Discard
          </button>
        </div>
      )}

      {actionError && (
        <p className="mt-1.5 text-[11px] font-semibold text-red-600">{actionError}</p>
      )}

      {/* Action bar */}
      <AnimatePresence>
        {actionsOpen && !deleted && !editing && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className={`mt-1.5 flex items-center gap-1 rounded-full border border-[#F0E9DF] bg-white p-1 shadow-[0_8px_20px_rgba(36,28,18,0.10)] ${
              isMine ? "flex-row-reverse" : ""
            }`}
          >
            {replyable && (
              <button
                type="button"
                onClick={() => { onReply(message); setActionsOpen(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B5F57] transition-colors hover:bg-[#F7F2EA] hover:text-[#B9401D]"
                aria-label="Reply"
              >
                <CornerUpLeft className="h-4 w-4" />
              </button>
            )}
            {message.body && (
              <button
                type="button"
                onClick={() => { void navigator.clipboard?.writeText(message.body ?? ""); setActionsOpen(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B5F57] transition-colors hover:bg-[#F7F2EA] hover:text-[#B9401D]"
                aria-label="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
            {editable && (
              <button
                type="button"
                onClick={() => { setEditing(true); setDraft(message.body ?? ""); setActionsOpen(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B5F57] transition-colors hover:bg-[#F7F2EA] hover:text-[#B9401D]"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {deletable && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2"
          >
            <span className="text-[11px] font-bold text-red-700">Delete for everyone?</span>
            <button
              type="button"
              onClick={submitDelete}
              disabled={busy}
              className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-extrabold text-white disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-full px-2.5 py-1 text-[10px] font-extrabold text-red-600"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <div
        className={`group relative flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : ""} ${
          endsRun ? "mb-2.5" : "mb-0.5"
        }`}
      >
        {!isMine && (
          <div className="w-9 shrink-0">
            {endsRun && <Avatar name={senderName} avatarUrl={senderAvatar} size="sm" />}
          </div>
        )}

        <div className={`relative max-w-[82%] md:max-w-[68%] ${isMine ? "ml-auto" : ""}`}>
          {/* Swipe-to-reply affordance (touch only) */}
          {isTouch && replyable && (
            <motion.span
              style={{ opacity: replyOpacity }}
              className="pointer-events-none absolute -left-11 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#FFF1E6] text-[#B9401D]"
            >
              <CornerUpLeft className="h-4 w-4" aria-hidden="true" />
            </motion.span>
          )}

          <motion.div
            style={isTouch && replyable ? { x } : undefined}
            drag={isTouch && replyable ? "x" : false}
            dragConstraints={{ left: 0, right: 88 }}
            dragElastic={0.18}
            dragDirectionLock
            dragMomentum={false}
            onDragEnd={(_event, info) => {
              if (info.offset.x > SWIPE_TRIGGER_PX) onReply(message);
              x.set(0);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              setActionsOpen((open) => !open);
            }}
            onTouchStart={() => {
              if (!isTouch) return;
              longPressRef.current = window.setTimeout(() => setActionsOpen(true), 450);
            }}
            onTouchEnd={() => window.clearTimeout(longPressRef.current)}
            onTouchMove={() => window.clearTimeout(longPressRef.current)}
          >
            {body}
          </motion.div>

          {/* Desktop hover trigger */}
          {!isTouch && !deleted && (replyable || editable || deletable || message.body) && (
            <button
              type="button"
              onClick={() => setActionsOpen((open) => !open)}
              aria-label="Message actions"
              className={`absolute top-1 hidden h-7 w-7 items-center justify-center rounded-full border border-[#F0E9DF] bg-white text-[#6B5F57] shadow-sm transition-colors hover:text-[#B9401D] group-hover:flex ${
                isMine ? "-left-9" : "-right-9"
              } ${actionsOpen ? "flex" : ""}`}
            >
              <CornerUpLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.local_url || lightbox.url}
              alt=""
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
              onClick={(event) => event.stopPropagation()}
            />
            <a
              href={lightbox.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={(event) => event.stopPropagation()}
              className="absolute bottom-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-[#252423]"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Download
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
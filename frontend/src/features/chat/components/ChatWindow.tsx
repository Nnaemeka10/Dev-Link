"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  BellOff,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Hash,
  LifeBuoy,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Package,
  RefreshCw,
  UserRound,
  WifiOff,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { EmptyState } from "./EmptyState";
import { MessageBubble, type ReceiptState } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import type { useChat } from "../hooks/useChat";
import type { ChatMessage, ChatRole, ChatThread } from "../chat.types";
import {
  computeGroupFlags,
  getConversationName,
  isSupportAgentView,
  participantName,
  supportCustomerEmail,
  supportCustomerId,
} from "../utils";
import { bookedSpans, formatEventTimeLabel, spansLabel } from "@/lib/datetime";

type ChatController = ReturnType<typeof useChat>;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const NEAR_BOTTOM_PX = 140;
const LOAD_OLDER_PX = 120;

const BOOKING_TONES: Record<string, string> = {
  confirmed: "bg-[#E8F3EC] text-[#2D5A27]",
  completed: "bg-[#E8F3EC] text-[#2D5A27]",
  processing_payout: "bg-[#E8F3EC] text-[#2D5A27]",
  payout_released: "bg-[#E8F3EC] text-[#2D5A27]",
  paid: "bg-[#FFF1E6] text-[#B9401D]",
  funds_held: "bg-[#FFF1E6] text-[#B9401D]",
  pending: "bg-[#FFF1E6] text-[#B9401D]",
  cancelled: "bg-[#F1EFEA] text-[#6B5F57]",
  declined: "bg-[#F1EFEA] text-[#6B5F57]",
  refunded: "bg-[#F1EFEA] text-[#6B5F57]",
  failed: "bg-red-50 text-red-600",
  expired: "bg-[#F1EFEA] text-[#6B5F57]",
};

const keyOf = (message: ChatMessage) => message.client_id ?? `s-${message.id}`;

function nairaFromKobo(kobo: number): string {
  return `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

/**
 * The persisted thread context. This is a property of the conversation, not of
 * the navigation - it renders however the user arrived, so opening a thread
 * from the inbox never loses the listing or booking it is about.
 *
 * Support threads are role-aware:
 *  - the customer sees the EventVnV Support card;
 *  - the agent sees a pinned customer identity strip (name, user id, email)
 *    so every conversation is attributable at a glance.
 */
function ThreadContextCard({ thread, role }: { thread: ChatThread; role: ChatRole }) {
  const [collapsed, setCollapsed] = useState(false);
  const [copiedField, setCopiedField] = useState<"id" | "email" | null>(null);
  const copyTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  const copyValue = (field: "id" | "email", value: string) => {
    void navigator.clipboard?.writeText(value);
    setCopiedField(field);
    window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopiedField(null), 1600);
  };

  if (thread.is_support) {
    if (isSupportAgentView(thread)) {
      const idLabel = supportCustomerId(thread);
      const email = supportCustomerEmail(thread);
      const rawId = thread.counterparty?.user_id;

      return (
        <div className="shrink-0 border-b border-[#F0E9DF] bg-[#F7F2EA] px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#B9401D]">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A9AAE]">
                Customer
              </p>
              <p className="truncate text-sm font-extrabold text-[#252423]">
                {getConversationName(thread)}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {idLabel && rawId != null && (
                  <button
                    type="button"
                    onClick={() => copyValue("id", String(rawId))}
                    className="inline-flex items-center gap-1 rounded-full border border-[#E8DDD2] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#6B5F57] transition-colors hover:border-[#B9401D]/40 hover:text-[#B9401D]"
                    aria-label={`Copy user id ${rawId}`}
                  >
                    <Hash className="h-3 w-3" aria-hidden="true" />
                    {idLabel}
                    {copiedField === "id" ? (
                      <Check className="h-3 w-3 text-[#2D5A27]" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-60" aria-hidden="true" />
                    )}
                  </button>
                )}

                {email && (
                  <>
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex min-w-0 items-center gap-1 rounded-full border border-[#E8DDD2] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#6B5F57] transition-colors hover:border-[#B9401D]/40 hover:text-[#B9401D]"
                    >
                      <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{email}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyValue("email", email)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#E8DDD2] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#6B5F57] transition-colors hover:border-[#B9401D]/40 hover:text-[#B9401D]"
                      aria-label={`Copy email ${email}`}
                    >
                      {copiedField === "email" ? (
                        <Check className="h-3 w-3 text-[#2D5A27]" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-60" aria-hidden="true" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="shrink-0 border-b border-[#F0E9DF] bg-[#F7F2EA] px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#B9401D]">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-[#252423]">EventVnV Support</p>
            <p className="mt-0.5 text-[11px] font-semibold leading-5 text-[#6B5F57]">
              We reply within one business day. Include your booking reference (EVV-…) if you have one.
            </p>
          </div>
          <Link
            href="/help"
            className="shrink-0 rounded-full border border-[#E8DDD2] bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#252423] transition-colors hover:bg-[#FDFBF7]"
          >
            Help Center
          </Link>
        </div>
      </div>
    );
  }

  const { listing, booking } = thread;
  if (!listing && !booking) return null;

  const listingHref = listing
    ? `/listings/${listing.kind === "hall" ? "halls" : "services"}/${listing.id}`
    : null;
  const bookingHref = booking
    ? role === "host"
      ? `/vendor/bookings/${booking.id}`
      : "/saved?tab=bookings"
    : null;

  const spans = booking ? bookedSpans(booking.start_date, booking.end_date, booking.excluded_dates) : [];
  const dateLabel = spans.length > 0 ? spansLabel(spans, 2) : null;
  const timeLabel = booking ? formatEventTimeLabel(booking.start_time, booking.end_time) : "-";

  return (
    <div className="shrink-0 border-b border-[#F0E9DF] bg-[#F7F2EA]">
      <div className="flex items-center gap-3 px-4 py-3">
        {listing?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-[#E8DDD2]"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#B9401D]">
            {listing?.kind === "service" ? (
              <Package className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Building2 className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold text-[#252423]">
            {listing?.title ?? "Listing unavailable"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] font-semibold text-[#9A9AAE]">
            {listing?.kind === "service" ? "Service" : "Hall"}
            {listing?.location && (
              <>
                <span aria-hidden="true">·</span>
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{listing.location}</span>
              </>
            )}
            {listing && (
              <>
                <span aria-hidden="true">·</span>
                <span className="shrink-0 font-bold text-[#B9401D]">
                  from {nairaFromKobo(listing.price_from_kobo)}
                </span>
              </>
            )}
          </p>
        </div>

        {listingHref && (
          <Link
            href={listingHref}
            className="hidden shrink-0 items-center gap-1 rounded-full border border-[#E8DDD2] bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#252423] transition-colors hover:bg-[#FDFBF7] sm:inline-flex"
          >
            View listing <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand conversation details" : "Collapse conversation details"}
          aria-expanded={!collapsed}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9A9AAE] transition-colors hover:bg-white hover:text-[#252423]"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && booking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E8DDD2] px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-[#6B5F57]">
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-[#B9401D]" aria-hidden="true" />
                  <span className="font-extrabold text-[#252423]">{booking.reference}</span>
                </span>
                {dateLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 text-[#B9401D]" aria-hidden="true" />
                    {dateLabel}
                  </span>
                )}
                {timeLabel !== "-" && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-[#B9401D]" aria-hidden="true" />
                    {timeLabel}
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                    BOOKING_TONES[booking.status] ?? "bg-[#F1EFEA] text-[#6B5F57]"
                  }`}
                >
                  {booking.status.replace(/_/g, " ")}
                </span>
              </div>

              {bookingHref && (
                <Link
                  href={bookingHref}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#B9401D] underline decoration-[#B9401D]/30 underline-offset-2"
                >
                  View booking <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="flex-1 space-y-4 px-5 py-6">
      {[68, 44, 92, 56, 76].map((height, index) => (
        <div
          key={index}
          className={`flex ${index % 2 === 0 ? "" : "justify-end"}`}
          aria-hidden="true"
        >
          <div
            className="animate-pulse rounded-2xl bg-[#EFE7DE]"
            style={{ height, width: `${45 + (index % 3) * 12}%` }}
          />
        </div>
      ))}
    </div>
  );
}

interface ChatWindowProps {
  chat: ChatController;
  currentUserId: number;
  role: ChatRole;
  onBack?: () => void;
}

export function ChatWindow({ chat, currentUserId, role, onBack }: ChatWindowProps) {
  const thread = chat.activeThread;
  const messages = chat.messages;

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [flashId, setFlashId] = useState<number | null>(null);
  const [showBack, setShowBack] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ key: string; offset: number } | null>(null);
  const initialisedRef = useRef<string | null>(null);
  const prevCountRef = useRef(0);
  const prevThreadRef = useRef<string | null>(null);
  const flashTimerRef = useRef<number | undefined>(undefined);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 92,
    overscan: 8,
    getItemKey: (index) => keyOf(messages[index]),
  });

  useEffect(() => {
    setShowBack(window.matchMedia("(max-width: 767px)").matches);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => () => window.clearTimeout(flashTimerRef.current), []);

  // Thread switch: drop the reply draft and re-arm initial scroll.
  useEffect(() => {
    const id = thread?.id ?? null;
    if (prevThreadRef.current === id) return;
    prevThreadRef.current = id;
    setReplyTo(null);
    setMenuOpen(false);
    setAtBottom(true);
    anchorRef.current = null;
    prevCountRef.current = 0;
    initialisedRef.current = null;
  }, [thread?.id]);

  const participantsById = useMemo(
    () => new Map((thread?.participants ?? []).map((participant) => [participant.user_id, participant])),
    [thread?.participants]
  );

  const otherReadSeq = useMemo(() => {
    const others = (thread?.participants ?? []).filter((p) => p.user_id !== currentUserId);
    return others.reduce((max, p) => Math.max(max, p.last_read_seq), 0);
  }, [thread?.participants, currentUserId]);

  const otherDeliveredSeq = useMemo(() => {
    const others = (thread?.participants ?? []).filter((p) => p.user_id !== currentUserId);
    return others.reduce((max, p) => Math.max(max, p.delivered_seq), 0);
  }, [thread?.participants, currentUserId]);

  const receiptFor = useCallback(
    (message: ChatMessage): ReceiptState => {
      if (message.conversation_seq == null) return "sent";
      if (otherReadSeq >= message.conversation_seq) return "read";
      if (otherDeliveredSeq >= message.conversation_seq) return "delivered";
      return message.status === "read" ? "read" : message.status === "delivered" ? "delivered" : "sent";
    },
    [otherReadSeq, otherDeliveredSeq]
  );

  // Land at the newest message once per thread.
  useEffect(() => {
    if (!thread || chat.isLoadingMessages || messages.length === 0) return;
    if (initialisedRef.current === thread.id) return;
    initialisedRef.current = thread.id;
    const frame = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [thread, chat.isLoadingMessages, messages.length, virtualizer]);

  // Restore the reading position after older history is prepended.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const index = messages.findIndex((message) => keyOf(message) === anchor.key);
    if (index >= 0) {
      virtualizer.scrollToIndex(index, { align: "start" });
      const element = scrollRef.current;
      if (element) element.scrollTop -= anchor.offset;
    }
    anchorRef.current = null;
  }, [messages, virtualizer]);

  // Follow new messages only when the reader is already at the bottom, or when
  // they sent the message themselves.
  useEffect(() => {
    const grew = messages.length > prevCountRef.current;
    prevCountRef.current = messages.length;
    if (!grew || messages.length === 0) return;
    const last = messages[messages.length - 1];
    const mine = Number(last.sender_id) === Number(currentUserId);
    if (atBottom || mine) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    }
  }, [messages, atBottom, currentUserId, virtualizer]);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    setAtBottom(distance < NEAR_BOTTOM_PX);

    if (
      element.scrollTop < LOAD_OLDER_PX &&
      chat.hasOlderMessages &&
      !chat.isLoadingOlder &&
      !anchorRef.current
    ) {
      const first = virtualizer.getVirtualItems()[0];
      if (first && messages[first.index]) {
        anchorRef.current = {
          key: keyOf(messages[first.index]),
          offset: element.scrollTop - first.start,
        };
      }
      void chat.loadOlderMessages();
    }
  }, [chat, messages, virtualizer]);

  const jumpToMessage = useCallback(
    (messageId: number) => {
      const index = messages.findIndex((message) => message.id === messageId);
      if (index < 0) return;
      virtualizer.scrollToIndex(index, { align: "center" });
      setFlashId(messageId);
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = window.setTimeout(() => setFlashId(null), 1400);
    },
    [messages, virtualizer]
  );

  // The mutations resolve to the updated ChatMessage; MessageBubble only needs
  // to know when the work settled, so narrow the result to void here.
  const handleEditMessage = useCallback(
    async (messageId: number, body: string): Promise<void> => {
      await chat.editMessage({ messageId, body });
    },
    [chat]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: number): Promise<void> => {
      await chat.deleteMessage(messageId);
    },
    [chat]
  );

  if (!thread) {
    if (chat.isLoadingThread) return <ThreadSkeleton />;
    return <EmptyState variant="no-selection" />;
  }

  const displayName = getConversationName(thread);
  const agentView = isSupportAgentView(thread);
  const isMuted = !!thread.muted_until && new Date(thread.muted_until).getTime() > Date.now();
  const isArchived = !!thread.archived_at;
  const typingLabel =
    chat.typingUsers.length === 1
      ? `${chat.typingUsers[0].name} is typing…`
      : chat.typingUsers.length > 1
        ? "Several people are typing…"
        : null;

  const subtitle = agentView
    ? typingLabel ?? (thread.counterparty_online ? "Active now" : "Offline")
    : thread.is_support
      ? "We reply within one business day"
      : typingLabel ?? (thread.counterparty_online ? "Active now" : "Offline");

  async function handleMute(hours: number | null) {
    if (!thread) return;
    const until = hours == null ? null : new Date(Date.now() + hours * 3_600_000).toISOString();
    await chat.setMuted({ conversationId: thread.id, until });
    setMenuOpen(false);
  }

  async function handleArchive() {
    if (!thread) return;
    await chat.setArchived({ conversationId: thread.id, archived: !isArchived });
    setMenuOpen(false);
    if (!isArchived) onBack?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FDFBF7]">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-[#F0E9DF] bg-white px-3 py-3 md:px-5">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6B5F57] transition-colors hover:bg-[#F7F2EA]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <Avatar
          name={displayName}
          avatarUrl={thread.counterparty?.avatar_url}
          isOnline={thread.counterparty_online}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-[#252423]">{displayName}</p>
          <p
            className={`truncate text-[11px] font-semibold ${
              typingLabel
                ? "text-[#B9401D]"
                : thread.counterparty_online
                  ? "text-[#2D5A27]"
                  : "text-[#9A9AAE]"
            }`}
          >
            {subtitle}
          </p>
        </div>

        {isMuted && (
          <BellOff className="h-4 w-4 shrink-0 text-[#C4BBAE]" aria-label="Notifications muted" />
        )}

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Conversation options"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B5F57] transition-colors hover:bg-[#F7F2EA]"
          >
            <MoreVertical className="h-5 w-5" aria-hidden="true" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                role="menu"
                className="absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-2xl border border-[#F0E9DF] bg-white py-1.5 shadow-[0_18px_44px_rgba(36,28,18,0.16)]"
              >
                {isMuted ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleMute(null)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
                  >
                    <Bell className="h-4 w-4 text-[#9A9AAE]" aria-hidden="true" />
                    Unmute notifications
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleMute(8)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
                    >
                      <BellOff className="h-4 w-4 text-[#9A9AAE]" aria-hidden="true" />
                      Mute for 8 hours
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleMute(168)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
                    >
                      <BellOff className="h-4 w-4 text-[#9A9AAE]" aria-hidden="true" />
                      Mute for 1 week
                    </button>
                  </>
                )}
                <div className="my-1 border-t border-[#F0E9DF]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleArchive()}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
                >
                  {isArchived ? (
                    <ArchiveRestore className="h-4 w-4 text-[#9A9AAE]" aria-hidden="true" />
                  ) : (
                    <Archive className="h-4 w-4 text-[#9A9AAE]" aria-hidden="true" />
                  )}
                  {isArchived ? "Unarchive" : "Archive conversation"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <ThreadContextCard thread={thread} role={role} />

      {/* Connection state */}
      <AnimatePresence initial={false}>
        {!chat.isConnected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 bg-[#FFF7F2] px-4 py-2 text-[11px] font-bold text-[#8A5A44]">
              {chat.connectionError && /auth|token|expired|invalid/i.test(chat.connectionError) ? (
                <>
                  <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                  Session expired.
                  <Link href="/login" className="underline">
                    Sign in again
                  </Link>
                </>
              ) : (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Reconnecting… messages will catch up automatically.
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="relative min-h-0 flex-1">
        {chat.isLoadingMessages ? (
          <ThreadSkeleton />
        ) : messages.length === 0 ? (
          <EmptyState variant="no-messages" />
        ) : (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            role="log"
            aria-live="polite"
            aria-label={`Conversation with ${displayName}`}
            className="h-full overflow-y-auto overscroll-contain px-3 py-4 md:px-5 [scrollbar-color:#D8CDBF_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
          >
            {chat.isLoadingOlder && (
              <div className="mb-3 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9A9AAE] shadow-sm">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  Loading history
                </span>
              </div>
            )}

            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const message = messages[virtualRow.index];
                if (!message) return null;

                const flags = computeGroupFlags(messages, virtualRow.index);
                const mine = Number(message.sender_id) === Number(currentUserId);
                const sender = participantsById.get(Number(message.sender_id));
                const senderName =
                  participantName(sender?.first_name, sender?.last_name) ||
                  (mine ? "You" : displayName);

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {flags.showDateSeparator && (
                      <div className="flex justify-center py-3">
                        <span className="rounded-full bg-[#EFE7DE] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6B5F57]">
                          {flags.dateLabel}
                        </span>
                      </div>
                    )}

                    <div
                      className={`rounded-2xl transition-colors duration-500 ${
                        flashId === message.id ? "bg-[#FFF1E6]" : ""
                      }`}
                    >
                      <MessageBubble
                        message={message}
                        isMine={mine}
                        currentUserId={currentUserId}
                        senderName={senderName}
                        senderAvatar={sender?.avatar_url ?? thread.counterparty?.avatar_url ?? null}
                        showSender={thread.is_support}
                        startsRun={flags.startsRun}
                        endsRun={flags.endsRun}
                        receiptState={receiptFor(message)}
                        onReply={setReplyTo}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        onRetry={chat.retryMessage}
                        onDiscard={chat.discardPending}
                        onJumpToMessage={jumpToMessage}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Jump to latest */}
        <AnimatePresence>
          {!atBottom && messages.length > 0 && !chat.isLoadingMessages && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              onClick={() => virtualizer.scrollToIndex(messages.length - 1, { align: "end" })}
              aria-label="Jump to latest messages"
              className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#F0E9DF] bg-white text-[#B9401D] shadow-[0_10px_26px_rgba(36,28,18,0.14)] transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Typing row */}
      <AnimatePresence initial={false}>
        {chat.typingUsers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-5 pb-2">
              <Avatar
                name={chat.typingUsers[0].name}
                avatarUrl={thread.counterparty?.avatar_url}
                size="xs"
              />
              <span className="flex items-center gap-1 rounded-full border border-[#F0E9DF] bg-white px-3 py-2">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C4BBAE]"
                    style={{ animationDelay: `${dot * 0.15}s` }}
                  />
                ))}
              </span>
              <span className="text-[11px] font-semibold text-[#9A9AAE]">
                {chat.typingUsers[0].name} is typing
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {chat.messagesError && messages.length === 0 && (
        <div className="shrink-0 px-5 pb-3">
          <button
            type="button"
            onClick={() => void chat.refetchMessages()}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8DDD2] bg-white px-4 py-2 text-[11px] font-extrabold text-[#252423]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Couldn&apos;t load messages — retry
          </button>
        </div>
      )}

      <ChatInput
        onSend={chat.sendMessage}
        onTyping={chat.setTyping}
        isSending={chat.isSending}
        disabled={!chat.isConnected}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        replyLabel={
          replyTo && Number(replyTo.sender_id) === Number(currentUserId)
            ? "yourself"
            : displayName
        }
        warning={chat.warning}
        onDismissWarning={chat.dismissWarning}
        sendError={chat.sendError}
        onClearSendError={chat.clearSendError}
      />
    </div>
  );
}
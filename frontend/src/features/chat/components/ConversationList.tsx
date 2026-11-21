"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  ArrowLeftRight,
  BellOff,
  Building2,
  CloudOff,
  Hash,
  LifeBuoy,
  MoreVertical,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { EmptyState } from "./EmptyState";
import type { ChatRole, ChatThread } from "../chat.types";
import {
  formatInboxTimestamp,
  getConversationName,
  isSupportAgentView,
  lastMessagePreviewText,
  supportCustomerEmail,
  supportCustomerId,
} from "../utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface OtherSurface {
  label: string;
  unread: number;
  onNavigate: () => void;
}

interface ConversationListProps {
  conversations: ChatThread[];
  activeId: string | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
  onMute: (id: string, until: string | null) => void;
  currentUserId: number;
  role: ChatRole;
  otherSurface?: OtherSurface | null;
  showArchived: boolean;
  onToggleArchived: () => void;
  onContactSupport: () => void;
}

function ListSkeleton() {
  return (
    <div className="space-y-1 px-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl px-3 py-3.5">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#EFE7DE]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#EFE7DE]" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-[#EFE7DE]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationRow({
  thread,
  active,
  currentUserId,
  onSelect,
  onArchive,
  onMute,
}: {
  thread: ChatThread;
  active: boolean;
  currentUserId: number;
  onSelect: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
  onMute: (id: string, until: string | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const name = getConversationName(thread);
  const preview = lastMessagePreviewText(thread.last_message);
  const mine =
    thread.last_message && Number(thread.last_message.sender_id) === Number(currentUserId);
  const isMuted = !!thread.muted_until && new Date(thread.muted_until).getTime() > Date.now();
  const isArchived = !!thread.archived_at;

  // Agent support rows are labelled by the CUSTOMER, with id + email in the
  // chip so two customers with the same display name stay distinguishable.
  const agentSupport = isSupportAgentView(thread);
  const contextLabel = agentSupport
    ? [supportCustomerId(thread), supportCustomerEmail(thread)].filter(Boolean).join(" · ") || null
    : thread.is_support
      ? "Support"
      : thread.booking
        ? thread.booking.reference
        : thread.listing?.title ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onSelect(thread.id)}
        aria-current={active ? "true" : undefined}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 pr-11 text-left transition-colors ${
          active
            ? "bg-[#FFF1E6] ring-1 ring-[#B9401D]/15"
            : "hover:bg-[#F7F2EA] active:bg-[#F3EDE4]"
        }`}
      >
        <Avatar
          name={name}
          avatarUrl={thread.counterparty?.avatar_url}
          isOnline={thread.counterparty_online}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`truncate text-sm ${
                thread.unread_count > 0 || active
                  ? "font-extrabold text-[#252423]"
                  : "font-bold text-[#3F3B37]"
              }`}
            >
              {name}
            </span>
            <span className="shrink-0 text-[10px] font-bold text-[#B6A99E]">
              {formatInboxTimestamp(thread.last_message_at ?? thread.created_at)}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <p
              className={`min-w-0 flex-1 truncate text-xs ${
                thread.unread_count > 0 ? "font-bold text-[#4A443F]" : "font-semibold text-[#9A9AAE]"
              }`}
            >
              {mine && thread.last_message && !thread.last_message.deleted ? "You: " : ""}
              {preview}
            </p>
            {isMuted && <BellOff className="h-3 w-3 shrink-0 text-[#C4BBAE]" aria-label="Muted" />}
            {thread.unread_count > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#B9401D] px-1.5 text-[10px] font-extrabold text-white">
                {thread.unread_count > 99 ? "99+" : thread.unread_count}
              </span>
            )}
          </div>

          {contextLabel && (
            <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#8A7F75] ring-1 ring-[#F0E9DF]">
              {agentSupport ? (
                <Hash className="h-2.5 w-2.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              ) : thread.is_support ? (
                <LifeBuoy className="h-2.5 w-2.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              ) : thread.booking ? (
                <Hash className="h-2.5 w-2.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              ) : thread.listing?.kind === "service" ? (
                <Package className="h-2.5 w-2.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              ) : (
                <Building2 className="h-2.5 w-2.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
              )}
              <span className="truncate">{contextLabel}</span>
            </span>
          )}
        </div>
      </button>

      {/* Sibling of the select button - never nested inside it. */}
      <div className="absolute right-2 top-3" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={`Options for ${name}`}
          aria-expanded={menuOpen}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[#B6A99E] transition-colors hover:bg-white hover:text-[#252423] ${
            menuOpen ? "bg-white text-[#252423]" : ""
          }`}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              role="menu"
              className="absolute right-0 top-9 z-30 w-52 overflow-hidden rounded-2xl border border-[#F0E9DF] bg-white py-1.5 shadow-[0_18px_44px_rgba(36,28,18,0.16)]"
            >
              {isMuted ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { onMute(thread.id, null); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
                >
                  Unmute
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onMute(thread.id, new Date(Date.now() + 8 * 3_600_000).toISOString());
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
                >
                  Mute for 8 hours
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => { onArchive(thread.id, !isArchived); setMenuOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
              >
                {isArchived ? (
                  <ArchiveRestore className="h-4 w-4 text-[#9A9AAE]" aria-hidden="true" />
                ) : (
                  <Archive className="h-4 w-4 text-[#9A9AAE]" aria-hidden="true" />
                )}
                {isArchived ? "Unarchive" : "Archive"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  isError,
  onRetry,
  onSelect,
  onArchive,
  onMute,
  currentUserId,
  role,
  otherSurface,
  showArchived,
  onToggleArchived,
  onContactSupport,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? conversations.filter((thread) => {
          const haystack = [
            getConversationName(thread),
            thread.listing?.title ?? "",
            thread.booking?.reference ?? "",
            thread.last_message?.body ?? "",
            supportCustomerEmail(thread) ?? "",
            supportCustomerId(thread) ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
      : conversations;

    // Support is always reachable, so it stays pinned above the recency list.
    return [...base].sort((a, b) => Number(b.is_support) - Number(a.is_support));
  }, [conversations, search]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 px-4 pb-3 pt-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-headline text-xl font-extrabold tracking-tight text-[#252423]">
            {showArchived ? "Archived" : role === "host" ? "Client messages" : "Messages"}
          </h1>
          <button
            type="button"
            onClick={onToggleArchived}
            aria-pressed={showArchived}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
              showArchived
                ? "bg-[#252423] text-white"
                : "border border-[#E8DDD2] text-[#6B5F57] hover:bg-[#F7F2EA]"
            }`}
          >
            {showArchived ? (
              <ArchiveRestore className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Archive className="h-3 w-3" aria-hidden="true" />
            )}
            {showArchived ? "Back" : "Archived"}
          </button>
        </div>

        {otherSurface && (
          <button
            type="button"
            onClick={otherSurface.onNavigate}
            className="mt-3 flex w-full items-center justify-between gap-2 rounded-2xl border border-[#F0E9DF] bg-[#F7F2EA] px-3.5 py-2.5 text-left transition-colors hover:bg-[#F3EDE4]"
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold text-[#252423]">
              <ArrowLeftRight className="h-3.5 w-3.5 text-[#B9401D]" aria-hidden="true" />
              {otherSurface.label}
            </span>
            {otherSurface.unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B9401D] px-1.5 text-[10px] font-extrabold text-white">
                {otherSurface.unread > 99 ? "99+" : otherSurface.unread}
              </span>
            )}
          </button>
        )}

        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B6A99E]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, listing or reference"
            aria-label="Search conversations"
            className="w-full rounded-2xl border border-[#F0E9DF] bg-[#F7F2EA] py-2.5 pl-10 pr-9 text-sm font-medium text-[#252423] outline-none transition-colors placeholder:text-[#B6A99E] focus:border-[#B9401D]/35 focus:bg-white focus:ring-2 focus:ring-[#B9401D]/12"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B6A99E] hover:text-[#252423]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-24 xl:pb-4 [scrollbar-color:#D8CDBF_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8CDBF] [&::-webkit-scrollbar-thumb:hover]:bg-[#B9401D]/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
        {isLoading ? (
          <ListSkeleton />
        ) : isError && conversations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
              <CloudOff className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-extrabold text-[#252423]">Couldn&apos;t load messages</p>
            <p className="mt-1 text-xs font-semibold text-[#9A9AAE]">Check your connection and try again.</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#B9401D] px-5 py-2.5 text-xs font-extrabold text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          search ? (
            <EmptyState variant="no-results" />
          ) : showArchived ? (
            <div className="px-8 py-16 text-center">
              <p className="text-sm font-extrabold text-[#252423]">Nothing archived</p>
              <p className="mt-1.5 text-xs font-semibold text-[#9A9AAE]">
                Archived conversations stay here until you bring them back.
              </p>
            </div>
          ) : (
            <EmptyState variant="no-conversations" onContactSupport={onContactSupport} />
          )
        ) : (
          <div className="space-y-0.5">
            {filtered.map((thread) => (
              <ConversationRow
                key={thread.id}
                thread={thread}
                active={thread.id === activeId}
                currentUserId={currentUserId}
                onSelect={onSelect}
                onArchive={onArchive}
                onMute={onMute}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
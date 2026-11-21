"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import * as api from "../chat.api";
import {
  CHAT_LIMITS,
  isPendingMessage,
  type ChatAttachment,
  type ChatMessage,
  type ChatRole,
  type ChatThread,
  type MessagePage,
  type TypingPayload,
} from "../chat.types";
import {
  highestSeq,
  mergeWithPending,
  newClientId,
  sortById,
} from "../utils";
import { useChatWebsocket } from "./useChatWebsocket";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: (role: ChatRole) => ["chat", "conversations", role] as const,
  conversation: (id: string) => ["chat", "conversation", id] as const,
  messages: (id: string) => ["chat", "messages", id] as const,
  unread: ["chat", "unread"] as const,
  supportAgents: ["chat", "support", "agents"] as const,
};

/**
 * Local backstop for a lost typing:stop. Slightly longer than the server's
 * CHAT_LIMITS.TYPING_TTL_MS so the server normally clears it first and this
 * only fires when that event never arrived.
 */
const TYPING_EXPIRY_MS = 8_000;

type MessagesData = InfiniteData<MessagePage, string | undefined>;
type ChatSocketApi = ReturnType<typeof useChatWebsocket>;

export interface SendInput {
  body: string;
  files?: File[];
  replyTo?: ChatMessage | null;
}

interface PendingPayload {
  body: string | null;
  attachments: api.UploadedAttachment[];
  replyToMessageId: number | null;
}

/** Insert or replace by id, and drop any optimistic row sharing a client_id. */
function upsertIntoPages(data: MessagesData | undefined, message: ChatMessage): MessagesData | undefined {
  if (!data || data.pages.length === 0) return data;

  const pages = data.pages.map((page) => ({
    ...page,
    messages: page.messages.filter(
      (existing) =>
        existing.id !== message.id &&
        !(message.client_id && existing.client_id === message.client_id && isPendingMessage(existing))
    ),
  }));

  const alreadyPlaced = pages.some((page) => page.messages.some((m) => m.id === message.id));
  if (!alreadyPlaced) {
    // Newest page is index 0; append then keep ascending order.
    pages[0] = { ...pages[0], messages: sortById([...pages[0].messages, message]) };
  } else {
    for (let i = 0; i < pages.length; i += 1) {
      const index = pages[i].messages.findIndex((m) => m.id === message.id);
      if (index !== -1) {
        const next = [...pages[i].messages];
        next[index] = message;
        pages[i] = { ...pages[i], messages: next };
        break;
      }
    }
  }

  return { ...data, pages };
}

export function useChat(
  userId: number | undefined,
  activeThreadId: string | null,
  role: ChatRole
) {
  const queryClient = useQueryClient();

  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: number; name: string }>>([]);

  const pendingPayloadsRef = useRef(new Map<string, PendingPayload>());
  const activeThreadRef = useRef<string | null>(activeThreadId);
  const typingTimersRef = useRef(new Map<number, number>());
  const uploadAbortRef = useRef<AbortController | null>(null);

  /**
   * Declared BEFORE the socket hook so the handlers below close over an
   * initialised binding rather than one still in its temporal dead zone.
   * Assigned immediately after the hook returns - never read during render.
   */
  const socketRef = useRef<ChatSocketApi | null>(null);

  useEffect(() => {
    activeThreadRef.current = activeThreadId;
  }, [activeThreadId]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const conversationsQuery = useQuery({
    queryKey: chatKeys.conversations(role),
    queryFn: () => api.fetchConversations(role),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const unreadQuery = useQuery({
    queryKey: chatKeys.unread,
    queryFn: api.fetchUnread,
    enabled: !!userId,
    staleTime: 15_000,
  });

  const messagesQuery = useInfiniteQuery<MessagePage, Error, MessagesData, readonly unknown[], string | undefined>({
    queryKey: chatKeys.messages(activeThreadId ?? ""),
    queryFn: ({ pageParam }) =>
      api.fetchMessages(activeThreadId!, { cursor: pageParam, direction: "before" }),
    enabled: !!userId && !!activeThreadId,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || lastPage.messages.length === 0) return undefined;
      const oldest = lastPage.messages[0]?.conversation_seq;
      return oldest != null ? String(oldest) : undefined;
    },
    staleTime: Infinity, // socket + explicit gap fill own freshness
    gcTime: 5 * 60_000,
  });

  const serverMessages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    return [...pages].reverse().flatMap((page) => page.messages);
  }, [messagesQuery.data]);

  // Deep link to a thread that is not in the first inbox page.
  const missingActive =
    !!activeThreadId &&
    !conversationsQuery.isLoading &&
    !(conversationsQuery.data ?? []).some((thread) => thread.id === activeThreadId);

  const singleThreadQuery = useQuery({
    queryKey: chatKeys.conversation(activeThreadId ?? ""),
    queryFn: () => api.fetchConversation(activeThreadId!),
    enabled: !!userId && missingActive,
    staleTime: 30_000,
  });

  const conversations = conversationsQuery.data ?? [];
  const activeThread = useMemo(() => {
    const found = conversations.find((thread) => thread.id === activeThreadId);
    if (found) return found;
    if (singleThreadQuery.data?.id === activeThreadId) return singleThreadQuery.data;
    return null;
  }, [conversations, activeThreadId, singleThreadQuery.data]);

  const activePending = useMemo(
    () => pending.filter((message) => message.conversation_id === activeThreadId),
    [pending, activeThreadId]
  );

  const messages = useMemo(
    () => mergeWithPending(serverMessages, activePending),
    [serverMessages, activePending]
  );

  const latestSeq = useMemo(() => highestSeq(serverMessages), [serverMessages]);

  // ── Cache writers ─────────────────────────────────────────────────────────
  const writeMessage = useCallback(
    (message: ChatMessage) => {
      queryClient.setQueryData<MessagesData>(
        chatKeys.messages(message.conversation_id),
        (data) => upsertIntoPages(data, message)
      );
      if (message.client_id) {
        const clientId = message.client_id;
        setPending((current) => current.filter((item) => item.client_id !== clientId));
        pendingPayloadsRef.current.delete(clientId);
      }
    },
    [queryClient]
  );

  const bumpThread = useCallback(
    (conversationId: string, message?: ChatMessage) => {
      queryClient.setQueryData<ChatThread[]>(chatKeys.conversations(role), (current) => {
        if (!current) return current;
        const index = current.findIndex((thread) => thread.id === conversationId);
        if (index === -1) {
          // Unknown thread (new inquiry) - let the server tell us about it.
          void queryClient.invalidateQueries({ queryKey: chatKeys.conversations(role) });
          return current;
        }

        const thread = current[index];
        const isActive = activeThreadRef.current === conversationId;
        const fromMe = !!message && Number(message.sender_id) === Number(userId);
        const countsAsUnread = !!message && (!fromMe || message.type === "system");

        const updated: ChatThread = {
          ...thread,
          last_message_at: message?.created_at ?? new Date().toISOString(),
          updated_at: message?.created_at ?? thread.updated_at,
          unread_count: isActive || !countsAsUnread ? thread.unread_count : thread.unread_count + 1,
          last_message: message
            ? {
                id: message.id,
                seq: message.conversation_seq ?? 0,
                sender_id: message.sender_id,
                type: message.type,
                body: message.deleted_at ? null : message.body,
                deleted: !!message.deleted_at,
                has_attachments: (message.attachments?.length ?? 0) > 0,
                created_at: message.created_at,
              }
            : thread.last_message,
        };

        return [updated, ...current.filter((_, i) => i !== index)];
      });

      void queryClient.invalidateQueries({ queryKey: chatKeys.unread });
    },
    [queryClient, role, userId]
  );

  const applyReceipt = useCallback(
    (conversationId: string, readerId: number, upToSeq: number, status: "read" | "delivered") => {
      queryClient.setQueryData<MessagesData>(chatKeys.messages(conversationId), (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            messages: page.messages.map((message) => {
              // Only OUR messages can be read/delivered by someone else.
              if (Number(message.sender_id) !== Number(userId)) return message;
              if (Number(readerId) === Number(userId)) return message;
              if (message.conversation_seq == null || message.conversation_seq > upToSeq) return message;
              if (status === "delivered" && message.status === "read") return message;
              if (message.status === status) return message;
              return { ...message, status };
            }),
          })),
        };
      });

      queryClient.setQueryData<ChatThread[]>(chatKeys.conversations(role), (current) => {
        if (!current) return current;
        let changed = false;
        const next = current.map((thread) => {
          if (thread.id !== conversationId) return thread;
          const participants = thread.participants.map((participant) => {
            if (participant.user_id !== readerId) return participant;
            const nextRead =
              status === "read"
                ? Math.max(participant.last_read_seq, upToSeq)
                : participant.last_read_seq;
            const nextDelivered = Math.max(participant.delivered_seq, upToSeq);
            if (
              nextRead === participant.last_read_seq &&
              nextDelivered === participant.delivered_seq
            ) {
              return participant;
            }
            changed = true;
            return { ...participant, last_read_seq: nextRead, delivered_seq: nextDelivered };
          });
          return participants === thread.participants ? thread : { ...thread, participants };
        });
        return changed ? next : current;
      });
    },
    [queryClient, role, userId]
  );

  // ── Socket ────────────────────────────────────────────────────────────────
  const socket = useChatWebsocket(userId, {
    onMessageCreated: (message) => {
      writeMessage(message);
      bumpThread(message.conversation_id, message);
      if (
        message.conversation_id === activeThreadRef.current &&
        message.conversation_seq != null &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        socketRef.current?.markRead(message.conversation_id, message.conversation_seq);
      }
    },
    onMessageUpdated: (message) => writeMessage(message),
    onMessageDeleted: (message) => {
      if (message.conversation_seq != null) {
        writeMessage(message as ChatMessage);
      } else {
        queryClient.setQueryData<MessagesData>(chatKeys.messages(message.conversation_id), (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  messages: page.messages.map((item) =>
                    item.id === message.id
                      ? { ...item, deleted_at: message.deleted_at ?? new Date().toISOString(), body: null, attachments: [] }
                      : item
                  ),
                })),
              }
            : data
        );
      }
      bumpThread(message.conversation_id);
    },
    onInboxUpdate: ({ conversationId, message }) => bumpThread(conversationId, message),
    onGapFill: (conversationId, page) => {
      for (const message of page.messages) writeMessage(message);
      const last = page.messages[page.messages.length - 1];
      if (last) bumpThread(conversationId, last);
    },
    onRead: ({ conversationId, readerId, readUpToSeq }) =>
      applyReceipt(conversationId, readerId, readUpToSeq, "read"),
    onDelivered: ({ conversationId, userId: readerId, deliveredUpToSeq }) =>
      applyReceipt(conversationId, readerId, deliveredUpToSeq, "delivered"),
    onReadSync: ({ conversationId, readUpToSeq }) => {
      queryClient.setQueryData<ChatThread[]>(chatKeys.conversations(role), (current) => {
        if (!current) return current;
        let changed = false;
        const next = current.map((thread) => {
          if (thread.id !== conversationId) return thread;
          const nextRead = Math.max(thread.last_read_seq, readUpToSeq);
          if (thread.unread_count === 0 && nextRead === thread.last_read_seq) return thread;
          changed = true;
          return { ...thread, unread_count: 0, last_read_seq: nextRead };
        });
        return changed ? next : current;
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread });
    },
    onPresence: ({ userId: otherId, isOnline }) => {
      queryClient.setQueryData<ChatThread[]>(chatKeys.conversations(role), (current) => {
        if (!current) return current;
        let changed = false;
        const next = current.map((thread) => {
          if (thread.counterparty?.user_id !== otherId) return thread;
          if (thread.counterparty_online === isOnline) return thread;
          changed = true;
          return { ...thread, counterparty_online: isOnline };
        });
        return changed ? next : current;
      });
    },
    onTyping: (payload: TypingPayload) => {
      if (Number(payload.userId) === Number(userId)) return;
      if (payload.conversationId !== activeThreadRef.current) return;

      const existing = typingTimersRef.current.get(payload.userId);
      if (existing) window.clearTimeout(existing);

      if (!payload.isTyping) {
        typingTimersRef.current.delete(payload.userId);
        setTypingUsers((current) =>
          current.some((entry) => entry.userId === payload.userId)
            ? current.filter((entry) => entry.userId !== payload.userId)
            : current
        );
        return;
      }

      setTypingUsers((current) =>
        current.some((entry) => entry.userId === payload.userId)
          ? current
          : [...current, { userId: payload.userId, name: payload.name }]
      );

      // Local safety net on top of the server TTL - a lost stop can never stick.
      typingTimersRef.current.set(
        payload.userId,
        window.setTimeout(() => {
          typingTimersRef.current.delete(payload.userId);
          setTypingUsers((current) =>
            current.some((entry) => entry.userId === payload.userId)
              ? current.filter((entry) => entry.userId !== payload.userId)
              : current
          );
        }, TYPING_EXPIRY_MS)
      );
    },
  });

  socketRef.current = socket;

  /**
   * Destructured so effects depend on the STABLE callbacks, never on the
   * wrapper object. Listing `socket` itself is what previously re-ran the
   * focus effect on every render and, with a setState inside it, looped.
   */
  const { focusConversation, markRead, registerSeq, setTyping: emitTyping } = socket;

  // Seed the resume cursor from loaded history (real seqs only).
  useEffect(() => {
    if (activeThreadId && latestSeq > 0) registerSeq(activeThreadId, latestSeq);
  }, [activeThreadId, latestSeq, registerSeq]);

  // Thread-scoped: tell the server which thread is on screen and drop any
  // typing indicators belonging to the previous one. Runs ONLY on thread
  // change, and the clearing setState bails out when already empty.
  useEffect(() => {
    focusConversation(activeThreadId);
    for (const timer of typingTimersRef.current.values()) window.clearTimeout(timer);
    typingTimersRef.current.clear();
    setTypingUsers((current) => (current.length === 0 ? current : []));
  }, [activeThreadId, focusConversation]);

  // Seq-scoped: mark read on open, on new messages, and on returning to the tab.
  useEffect(() => {
    if (!activeThreadId || latestSeq <= 0) return;

    const readIfVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      markRead(activeThreadId, latestSeq);
      queryClient.setQueryData<ChatThread[]>(chatKeys.conversations(role), (current) => {
        if (!current) return current;
        let changed = false;
        const next = current.map((thread) => {
          if (thread.id !== activeThreadId || thread.unread_count === 0) return thread;
          changed = true;
          return { ...thread, unread_count: 0 };
        });
        return changed ? next : current;
      });
    };

    readIfVisible();
    document.addEventListener("visibilitychange", readIfVisible);
    window.addEventListener("focus", readIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", readIfVisible);
      window.removeEventListener("focus", readIfVisible);
    };
  }, [activeThreadId, latestSeq, markRead, queryClient, role]);

  useEffect(
    () => () => {
      for (const timer of typingTimersRef.current.values()) window.clearTimeout(timer);
      typingTimersRef.current.clear();
      uploadAbortRef.current?.abort();
    },
    []
  );

  // ── Send ──────────────────────────────────────────────────────────────────
  const dispatch = useCallback(
    async (clientId: string, payload: PendingPayload) => {
      if (!activeThreadId) return;

      const socketApi = socketRef.current;
      if (!socketApi) {
        const message = "You're offline. Reconnecting…";
        setPending((current) =>
          current.map((item) =>
            item.client_id === clientId ? { ...item, status: "failed", error: message } : item
          )
        );
        setSendError(message);
        return;
      }

      const ack = await socketApi.sendMessage({
        conversationId: activeThreadId,
        clientId,
        body: payload.body,
        attachments: payload.attachments,
        replyToMessageId: payload.replyToMessageId,
      });

      if (!ack.ok || !ack.message) {
        const message = ack.error ?? "Couldn't send your message.";
        setPending((current) =>
          current.map((item) =>
            item.client_id === clientId ? { ...item, status: "failed", error: message } : item
          )
        );
        setSendError(message);
        return;
      }

      writeMessage({ ...ack.message, status: "sent" });
      bumpThread(ack.message.conversation_id, ack.message);
      if (ack.warning) setWarning(ack.warning);
      setSendError(null);
    },
    [activeThreadId, writeMessage, bumpThread]
  );

  const sendMessage = useCallback(
    async ({ body, files = [], replyTo = null }: SendInput) => {
      if (!activeThreadId || !userId) return;

      const trimmed = body.trim();
      if (!trimmed && files.length === 0) return;
      if (trimmed.length > CHAT_LIMITS.MAX_BODY) {
        setSendError(`Messages are limited to ${CHAT_LIMITS.MAX_BODY} characters.`);
        return;
      }
      if (files.length > CHAT_LIMITS.MAX_ATTACHMENTS) {
        setSendError(`Up to ${CHAT_LIMITS.MAX_ATTACHMENTS} attachments per message.`);
        return;
      }
      for (const file of files) {
        const problem = api.validateFile(file);
        if (problem) {
          setSendError(problem);
          return;
        }
      }

      setSendError(null);
      const clientId = newClientId();
      const now = new Date().toISOString();

      // Optimistic row appears BEFORE any upload so the user gets instant
      // feedback. conversation_seq stays null - it must never enter the cursor.
      const localAttachments: ChatAttachment[] = files.map((file, index) => ({
        id: `local-${clientId}-${index}`,
        message_id: 0,
        url: "",
        local_url: URL.createObjectURL(file),
        mime_type: file.type || "application/octet-stream",
        size: file.size,
        kind: api.attachmentKindFor(file.type || ""),
        progress: 0,
      }));

      const optimistic: ChatMessage = {
        id: -Date.now(),
        conversation_id: activeThreadId,
        sender_id: userId,
        conversation_seq: null,
        client_id: clientId,
        type: files.length > 0 ? (files.every((f) => f.type.startsWith("image/")) ? "image" : "file") : "text",
        body: trimmed || null,
        created_at: now,
        reply_to_message_id: replyTo?.id ?? null,
        reply_preview: replyTo
          ? {
              id: replyTo.id,
              seq: replyTo.conversation_seq ?? 0,
              sender_id: replyTo.sender_id,
              sender_name: Number(replyTo.sender_id) === Number(userId) ? "You" : activeThread?.display_name ?? "Guest",
              type: replyTo.type,
              body: replyTo.body?.slice(0, 160) ?? null,
              deleted: false,
              has_attachments: (replyTo.attachments?.length ?? 0) > 0,
            }
          : null,
        attachments: localAttachments,
        status: "sending",
      };

      setPending((current) => [...current, optimistic]);
      setIsSending(true);
      socketRef.current?.setTyping(activeThreadId, false);

      const abort = new AbortController();
      uploadAbortRef.current = abort;

      try {
        let uploaded: api.UploadedAttachment[] = [];

        if (files.length > 0) {
          const signature = await api.getUploadSignature();
          uploaded = [];
          for (let index = 0; index < files.length; index += 1) {
            const result = await api.uploadAttachment(
              files[index],
              signature,
              (percent) => {
                setPending((current) =>
                  current.map((item) =>
                    item.client_id === clientId
                      ? {
                          ...item,
                          attachments: item.attachments.map((attachment, i) =>
                            i === index ? { ...attachment, progress: percent } : attachment
                          ),
                        }
                      : item
                  )
                );
              },
              abort.signal
            );
            uploaded.push(result);
          }
        }

        const payload: PendingPayload = {
          body: trimmed || null,
          attachments: uploaded,
          replyToMessageId: replyTo?.id ?? null,
        };
        pendingPayloadsRef.current.set(clientId, payload);
        await dispatch(clientId, payload);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Upload failed.";
        setPending((current) =>
          current.map((item) =>
            item.client_id === clientId ? { ...item, status: "failed", error: message } : item
          )
        );
        setSendError(message);
      } finally {
        uploadAbortRef.current = null;
        setIsSending(false);
      }
    },
    [activeThreadId, userId, activeThread, dispatch]
  );

  /** Retry reuses the SAME client_id, so the server dedupes instead of duplicating. */
  const retryMessage = useCallback(
    async (clientId: string) => {
      const payload = pendingPayloadsRef.current.get(clientId);
      if (!payload) {
        setSendError("This message needs to be sent again from the composer.");
        return;
      }
      setSendError(null);
      setPending((current) =>
        current.map((item) =>
          item.client_id === clientId ? { ...item, status: "sending", error: null } : item
        )
      );
      setIsSending(true);
      try {
        await dispatch(clientId, payload);
      } finally {
        setIsSending(false);
      }
    },
    [dispatch]
  );

  const discardPending = useCallback((clientId: string) => {
    setPending((current) => {
      const target = current.find((item) => item.client_id === clientId);
      target?.attachments.forEach((attachment) => {
        if (attachment.local_url) URL.revokeObjectURL(attachment.local_url);
      });
      return current.filter((item) => item.client_id !== clientId);
    });
    pendingPayloadsRef.current.delete(clientId);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: ({ messageId, body }: { messageId: number; body: string }) =>
      api.editMessage(activeThreadId!, messageId, body),
    onSuccess: (message) => writeMessage(message),
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => api.deleteMessage(activeThreadId!, messageId),
    onSuccess: (message) => {
      writeMessage(message);
      bumpThread(message.conversation_id, message);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ conversationId, archived }: { conversationId: string; archived: boolean }) =>
      api.setArchived(conversationId, archived),
    onSuccess: (_result, variables) => {
      queryClient.setQueryData<ChatThread[]>(chatKeys.conversations(role), (current) =>
        current?.map((thread) =>
          thread.id === variables.conversationId
            ? { ...thread, archived_at: variables.archived ? new Date().toISOString() : null }
            : thread
        )
      );
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations(role) });
    },
  });

  const muteMutation = useMutation({
    mutationFn: ({ conversationId, until }: { conversationId: string; until: string | null }) =>
      api.setMuted(conversationId, until),
    onSuccess: (result, variables) => {
      queryClient.setQueryData<ChatThread[]>(chatKeys.conversations(role), (current) =>
        current?.map((thread) =>
          thread.id === variables.conversationId ? { ...thread, muted_until: result.mutedUntil } : thread
        )
      );
    },
  });

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (activeThreadId) emitTyping(activeThreadId, isTyping);
    },
    [activeThreadId, emitTyping]
  );

  return {
    // inbox
    conversations,
    isLoadingThreads: conversationsQuery.isLoading,
    threadsError: conversationsQuery.error,
    refetchThreads: conversationsQuery.refetch,
    unread: unreadQuery.data ?? { total: 0, guest: 0, host: 0, support: 0 },

    // active thread
    activeThread,
    isLoadingThread: missingActive ? singleThreadQuery.isLoading : conversationsQuery.isLoading,
    messages,
    isLoadingMessages: messagesQuery.isLoading,
    messagesError: messagesQuery.error,
    hasOlderMessages: messagesQuery.hasNextPage ?? false,
    isLoadingOlder: messagesQuery.isFetchingNextPage,
    loadOlderMessages: messagesQuery.fetchNextPage,
    refetchMessages: messagesQuery.refetch,

    // realtime
    isConnected: socket.isConnected,
    connectionError: socket.connectionError,
    isSupportAgent: socket.isSupportAgent,
    typingUsers,

    // compose
    isSending,
    warning,
    dismissWarning: () => setWarning(null),
    sendError,
    clearSendError: () => setSendError(null),
    sendMessage,
    retryMessage,
    discardPending,
    setTyping,

    // message actions
    editMessage: editMutation.mutateAsync,
    isEditing: editMutation.isPending,
    deleteMessage: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // thread actions
    setArchived: archiveMutation.mutateAsync,
    setMuted: muteMutation.mutateAsync,
  };
}
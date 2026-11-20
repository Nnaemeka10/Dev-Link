"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ChatMessage,
  DeliveredReceiptPayload,
  MessagePage,
  MessageSendAck,
  MessageSendPayload,
  PresencePayload,
  ReadReceiptPayload,
  SessionReadyPayload,
  TypingPayload,
} from "../chat.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const ACK_TIMEOUT_MS = 20_000;
const TYPING_THROTTLE_MS = 1500;
const TYPING_IDLE_MS = 2500;

export interface ChatSocketHandlers {
  onMessageCreated?: (message: ChatMessage) => void;
  onMessageUpdated?: (message: ChatMessage) => void;
  onMessageDeleted?: (message: Partial<ChatMessage> & { id: number; conversation_id: string }) => void;
  onInboxUpdate?: (payload: { conversationId: string; message?: ChatMessage }) => void;
  onTyping?: (payload: TypingPayload) => void;
  onRead?: (payload: ReadReceiptPayload) => void;
  onDelivered?: (payload: DeliveredReceiptPayload) => void;
  onReadSync?: (payload: { conversationId: string; readUpToSeq: number }) => void;
  onPresence?: (payload: PresencePayload) => void;
  onSessionReady?: (payload: SessionReadyPayload) => void;
  /** Reconnect gap fill - messages missed while the socket was down. */
  onGapFill?: (conversationId: string, page: MessagePage) => void;
}

/**
 * ONE socket per authenticated session.
 *
 * The previous implementation listed inline callback props in the connect
 * effect's dependency array. Because those arrows were recreated on every
 * render, the effect tore down and reconnected the socket continuously -
 * dropping events and re-running catch-up in a loop. Here the effect depends
 * on `userId` only, handlers are read through a ref, and every emitted action
 * is a stable useCallback.
 */
export function useChatWebsocket(userId: number | undefined, handlers: ChatSocketHandlers) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const seqRef = useRef(new Map<string, number>());
  const activeThreadRef = useRef<string | null>(null);
  const typingStateRef = useRef(new Map<string, { lastSent: number; idleTimer?: number }>());
  const authFailedRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSupportAgent, setIsSupportAgent] = useState(false);

  // Latest-handler ref. No dependency array: refresh after every render so the
  // socket never needs to be rebuilt to see new closures.
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const registerSeq = useCallback((conversationId: string, seq: number) => {
    if (!conversationId || !Number.isFinite(seq) || seq <= 0) return;
    const current = seqRef.current.get(conversationId) ?? 0;
    if (seq > current) seqRef.current.set(conversationId, seq);
  }, []);

  const syncConversation = useCallback(
    (conversationId: string, afterSeq: number): Promise<MessagePage | null> => {
      const socket = socketRef.current;
      if (!socket?.connected) return Promise.resolve(null);
      return new Promise((resolve) => {
        socket
          .timeout(ACK_TIMEOUT_MS)
          .emit("conversation:sync", { conversationId, afterSeq }, (err: unknown, page: MessagePage | null) => {
            resolve(err ? null : page);
          });
      });
    },
    []
  );

  useEffect(() => {
    if (!userId) return;
    authFailedRef.current = false;

    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: ACK_TIMEOUT_MS,
    });
    socketRef.current = socket;

    const gapFillAll = () => {
      for (const [conversationId, seq] of seqRef.current.entries()) {
        void syncConversation(conversationId, seq).then((page) => {
          if (page && page.messages.length > 0) {
            handlersRef.current.onGapFill?.(conversationId, page);
          }
        });
      }
    };

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      if (activeThreadRef.current) {
        socket.emit("conversation:focus", activeThreadRef.current);
      }
      gapFillAll();
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("connect_error", (error: Error) => {
      setIsConnected(false);
      const message = error?.message ?? "Connection failed";
      setConnectionError(message);
      // A rejected token will never succeed on retry - stop hammering the server.
      if (/auth|token|expired|invalid/i.test(message)) {
        authFailedRef.current = true;
        socket.io.opts.reconnection = false;
        socket.disconnect();
      }
    });

    socket.on("session:ready", (payload: SessionReadyPayload) => {
      setIsSupportAgent(payload?.isSupportAgent === true);
      handlersRef.current.onSessionReady?.(payload);
    });

    socket.on("message.created", (message: ChatMessage) => {
      if (message?.conversation_seq != null) {
        registerSeq(message.conversation_id, message.conversation_seq);
      }
      handlersRef.current.onMessageCreated?.(message);
    });

    socket.on("message.updated", (message: ChatMessage) => {
      if (message?.conversation_seq != null) {
        registerSeq(message.conversation_id, message.conversation_seq);
      }
      handlersRef.current.onMessageUpdated?.(message);
    });

    socket.on("message.deleted", (message: ChatMessage) => {
      handlersRef.current.onMessageDeleted?.(message);
    });

    socket.on("inbox.updated", (payload: { conversationId: string; message?: ChatMessage }) => {
      handlersRef.current.onInboxUpdate?.(payload);
    });

    socket.on("typing:start", (payload: TypingPayload) => handlersRef.current.onTyping?.(payload));
    socket.on("typing:stop", (payload: TypingPayload) => handlersRef.current.onTyping?.(payload));
    socket.on("message:read", (payload: ReadReceiptPayload) => handlersRef.current.onRead?.(payload));
    socket.on("message:delivered", (payload: DeliveredReceiptPayload) =>
      handlersRef.current.onDelivered?.(payload)
    );
    socket.on("conversation:read:sync", (payload: { conversationId: string; readUpToSeq: number }) =>
      handlersRef.current.onReadSync?.(payload)
    );
    socket.on("presence:update", (payload: PresencePayload) => handlersRef.current.onPresence?.(payload));

    return () => {
      for (const state of typingStateRef.current.values()) {
        if (state.idleTimer) window.clearTimeout(state.idleTimer);
      }
      typingStateRef.current.clear();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId, registerSeq, syncConversation]);

  const sendMessage = useCallback((payload: MessageSendPayload): Promise<MessageSendAck> => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      return Promise.resolve({
        ok: false,
        error: "You're offline. Reconnecting…",
        code: "OFFLINE",
      });
    }
    return new Promise((resolve) => {
      socket
        .timeout(ACK_TIMEOUT_MS)
        .emit("message:send", payload, (err: unknown, ack: MessageSendAck) => {
          if (err) {
            resolve({ ok: false, error: "Send timed out. Please retry.", code: "TIMEOUT" });
            return;
          }
          resolve(ack ?? { ok: false, error: "No response from server.", code: "NO_ACK" });
        });
    });
  }, []);

  const markRead = useCallback((conversationId: string, seq: number) => {
    if (!conversationId || !Number.isFinite(seq) || seq <= 0) return;
    registerSeq(conversationId, seq);
    socketRef.current?.emit("conversation:read", { conversationId, seq });
  }, [registerSeq]);

  const markDelivered = useCallback((conversationId: string, seq: number) => {
    if (!conversationId || !Number.isFinite(seq) || seq <= 0) return;
    socketRef.current?.emit("conversation:delivered", { conversationId, seq });
  }, []);

  const focusConversation = useCallback((conversationId: string | null) => {
    activeThreadRef.current = conversationId;
    socketRef.current?.emit("conversation:focus", conversationId);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:join", conversationId);
  }, []);

  /** Throttled start + idle stop. The server also expires typing independently. */
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket?.connected || !conversationId) return;

    const state = typingStateRef.current.get(conversationId) ?? { lastSent: 0 };
    if (state.idleTimer) {
      window.clearTimeout(state.idleTimer);
      state.idleTimer = undefined;
    }

    if (!isTyping) {
      if (state.lastSent > 0) socket.emit("typing:stop", conversationId);
      typingStateRef.current.set(conversationId, { lastSent: 0 });
      return;
    }

    const now = Date.now();
    if (now - state.lastSent >= TYPING_THROTTLE_MS) {
      socket.emit("typing:start", conversationId);
      state.lastSent = now;
    }
    state.idleTimer = window.setTimeout(() => {
      socket.emit("typing:stop", conversationId);
      typingStateRef.current.set(conversationId, { lastSent: 0 });
    }, TYPING_IDLE_MS);
    typingStateRef.current.set(conversationId, state);
  }, []);

  return {
    isConnected,
    connectionError,
    isSupportAgent,
    authFailed: authFailedRef.current,
    sendMessage,
    markRead,
    markDelivered,
    setTyping,
    focusConversation,
    joinConversation,
    syncConversation,
    registerSeq,
  };
}
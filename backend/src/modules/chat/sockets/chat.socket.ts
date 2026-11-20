import type { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken, type JwtPayload } from "../../../lib/utils.js";
import { getDB } from "../../../lib/db.js";
import { ChatModel } from "../models/Chat.js";
import { SupportAgentModel } from "../models/SupportAgents.js";
import { detectOffPlatform } from "../utils/moderation.js";
import { conversationRoom, userRoom } from "../../../lib/socket.js";
import {
  CHAT_LIMITS,
  type MessageSendAck,
  type MessageSendPayload,
  type MessagePage,
} from "../types/chat.js";

interface SocketData {
  user: JwtPayload;
  displayName: string;
  /** Rooms this socket joined, so presence can be broadcast on disconnecting. */
  conversationIds: Set<string>;
  focusedConversationId: string | null;
}

type ChatSocket = Socket & { data: SocketData };

/** userId - live socket ids. Single instance, so in-memory is authoritative. */
const onlineSockets = new Map<number, Set<string>>();

/** Auto-expiry for typing so a lost typing:stop can never stick forever. */
const typingTimers = new Map<string, NodeJS.Timeout>();
const typingKey = (conversationId: string, userId: number) => `${conversationId}:${userId}`;

function isMember(socket: ChatSocket, conversationId: string): boolean {
  return socket.rooms.has(conversationRoom(conversationId));
}

function clearTyping(io: SocketIOServer, conversationId: string, userId: number, name: string): void {
  const key = typingKey(conversationId, userId);
  const timer = typingTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    typingTimers.delete(key);
  }
  io.to(conversationRoom(conversationId)).emit("typing:stop", {
    conversationId,
    userId,
    name,
    isTyping: false,
  });
}

export function registerChatHandlers(io: SocketIOServer): void {
  //  Authentication 
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? "";
      const raw =
        (socket.handshake.auth?.token as string | undefined) ||
        /(?:^|;\s*)token=([^;]+)/.exec(cookieHeader)?.[1];

      if (!raw) return next(new Error("Authentication token required."));

      // verifyToken is async: it checks users.token_version AND is_active, so a
      // deactivated account or a pre-password-change cookie cannot connect.
      const decoded = await verifyToken(decodeURIComponent(raw));
      if (!decoded) return next(new Error("Invalid or expired token."));

      const db = getDB();
      const res = await db.query(
        `SELECT first_name, last_name, email FROM users WHERE id = $1`,
        [decoded.userId]
      );
      const row = res.rows[0];
      const name =
        [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim() ||
        (row?.email ? String(row.email).split("@")[0] : "Guest");

      const data = socket.data as SocketData;
      data.user = decoded;
      data.displayName = name;
      data.conversationIds = new Set();
      data.focusedConversationId = null;

      next();
    } catch (error) {
      console.error("Socket auth error:", error);
      next(new Error("Authentication failed."));
    }
  });

  io.on("connection", async (rawSocket) => {
    const socket = rawSocket as ChatSocket;
    const { userId } = socket.data.user;

    //  Rooms 
    // user:<id> drives inbox + unread badges. We also join every conversation
    // the user belongs to, so a message for ANY thread reaches this client
    // without it having to open that thread first.
    socket.join(userRoom(userId));

    try {
      const ids = await ChatModel.getConversationIdsForUser(userId);
      for (const id of ids) {
        socket.join(conversationRoom(id));
        socket.data.conversationIds.add(id);
      }
    } catch (error) {
      console.error("Room bootstrap failed:", error);
    }

    //  Presence 
    const sockets = onlineSockets.get(userId) ?? new Set<string>();
    const wasOffline = sockets.size === 0;
    sockets.add(socket.id);
    onlineSockets.set(userId, sockets);

    if (wasOffline) {
      for (const id of socket.data.conversationIds) {
        socket.to(conversationRoom(id)).emit("presence:update", {
          userId,
          isOnline: true,
          lastSeenAt: null,
        });
      }
    }

    //  Delivery catch-up 
    // Everything outstanding is marked delivered the moment the device is back.
    try {
      const delivered = await ChatModel.markAllDelivered(userId);
      for (const row of delivered) {
        io.to(conversationRoom(row.conversation_id)).emit("message:delivered", {
          conversationId: row.conversation_id,
          userId,
          deliveredUpToSeq: row.seq,
        });
      }
    } catch (error) {
      console.error("Delivery catch-up failed:", error);
    }

    socket.emit("session:ready", {
      userId,
      conversationIds: [...socket.data.conversationIds],
      isSupportAgent: await SupportAgentModel.isAgent(userId).catch(() => false),
    });

    //  Join / leave 
    socket.on(
      "conversation:join",
      async (conversationId: string, callback?: (ok: boolean) => void) => {
        try {
          if (!conversationId) return callback?.(false);
          const ok = await ChatModel.isParticipant(conversationId, userId);
          if (!ok) return callback?.(false);

          socket.join(conversationRoom(conversationId));
          socket.data.conversationIds.add(conversationId);
          callback?.(true);
        } catch (error) {
          console.error("Join conversation error:", error);
          callback?.(false);
        }
      }
    );

    // Explicit opt-out only. The client does NOT call this when closing a
    // thread - staying in the room is what keeps the inbox live.
    socket.on("conversation:leave", (conversationId: string) => {
      if (!conversationId) return;
      clearTyping(io, conversationId, userId, socket.data.displayName);
      socket.leave(conversationRoom(conversationId));
      socket.data.conversationIds.delete(conversationId);
      if (socket.data.focusedConversationId === conversationId) {
        socket.data.focusedConversationId = null;
      }
    });

    // Which thread is on screen. Drives read receipts and nothing else.
    socket.on("conversation:focus", (conversationId: string | null) => {
      socket.data.focusedConversationId = conversationId || null;
    });

    //  Gap fill on reconnect 
    socket.on(
      "conversation:sync",
      async (
        payload: { conversationId: string; afterSeq?: number },
        callback?: (page: MessagePage | null, error?: string) => void
      ) => {
        try {
          if (!payload?.conversationId || !isMember(socket, payload.conversationId)) {
            return callback?.(null, "Forbidden");
          }
          const after = Number(payload.afterSeq);
          const page = await ChatModel.getMessages(
            payload.conversationId,
            Number.isFinite(after) && after > 0 ? String(after) : null,
            "after",
            CHAT_LIMITS.MAX_PAGE_SIZE
          );
          callback?.(page);
        } catch (error) {
          console.error("Conversation sync error:", error);
          callback?.(null, "Sync failed");
        }
      }
    );

    //  Send 
    // Writes + acks ONLY. The LISTEN bridge owns the broadcast, so there is
    // exactly one emission per message regardless of origin.
    socket.on(
      "message:send",
      async (payload: MessageSendPayload, callback?: (ack: MessageSendAck) => void) => {
        const fail = (error: string, code?: string) => callback?.({ ok: false, error, code });
        try {
          if (!payload?.conversationId || !payload?.clientId) {
            return fail("conversationId and clientId are required", "BAD_REQUEST");
          }
          if (!isMember(socket, payload.conversationId)) {
            const ok = await ChatModel.isParticipant(payload.conversationId, userId);
            if (!ok) return fail("You are not in this conversation.", "FORBIDDEN");
            socket.join(conversationRoom(payload.conversationId));
            socket.data.conversationIds.add(payload.conversationId);
          }

          const body = typeof payload.body === "string" ? payload.body : null;
          const moderation = detectOffPlatform(body);

          const message = await ChatModel.createMessage(
            payload.conversationId,
            userId,
            payload.clientId,
            payload.type ?? "text",
            body,
            payload.attachments ?? [],
            payload.replyToMessageId ?? null,
            moderation
          );

          if (!message) return fail("Failed to save message.", "SAVE_FAILED");

          clearTyping(io, payload.conversationId, userId, socket.data.displayName);

          // The sender's own unread must not include what they just wrote.
          await ChatModel.markAsRead(payload.conversationId, userId, message.conversation_seq);

          callback?.({ ok: true, message, warning: moderation.warning });
        } catch (error: any) {
          const code = String(error?.message ?? "");
          const known: Record<string, string> = {
            EMPTY_MESSAGE: "Write a message or attach a file.",
            TOO_MANY_ATTACHMENTS: `Up to ${CHAT_LIMITS.MAX_ATTACHMENTS} attachments per message.`,
            UNSUPPORTED_ATTACHMENT_TYPE: "That file type isn't supported.",
            IMAGE_TOO_LARGE: "Images must be 10 MB or smaller.",
            FILE_TOO_LARGE: "Files must be 25 MB or smaller.",
            INVALID_ATTACHMENT_URL: "That attachment failed to upload. Please try again.",
            INVALID_ATTACHMENT_SIZE: "That attachment failed to upload. Please try again.",
            REPLY_TARGET_NOT_FOUND: "The message you replied to no longer exists.",
          };
          if (known[code]) return fail(known[code], code);
          console.error("Message send error:", error);
          fail("Couldn't send your message. Please try again.", "INTERNAL");
        }
      }
    );

    //  Receipts 
    socket.on(
      "conversation:read",
      async (payload: { conversationId: string; seq: number }) => {
        try {
          if (!payload?.conversationId || !isMember(socket, payload.conversationId)) return;
          const seq = Number(payload.seq);
          if (!Number.isFinite(seq) || seq <= 0) return;

          const readUpToSeq = await ChatModel.markAsRead(payload.conversationId, userId, seq);

          // to the whole room (not socket.to) so the reader's OTHER devices
          // clear their badges too.
          io.to(conversationRoom(payload.conversationId)).emit("message:read", {
            conversationId: payload.conversationId,
            readerId: userId,
            readUpToSeq,
          });
          io.to(userRoom(userId)).emit("conversation:read:sync", {
            conversationId: payload.conversationId,
            readUpToSeq,
          });
        } catch (error) {
          console.error("Read receipt error:", error);
        }
      }
    );

    socket.on(
      "conversation:delivered",
      async (payload: { conversationId: string; seq: number }) => {
        try {
          if (!payload?.conversationId || !isMember(socket, payload.conversationId)) return;
          const seq = Number(payload.seq);
          if (!Number.isFinite(seq) || seq <= 0) return;

          const deliveredUpToSeq = await ChatModel.markAsDelivered(
            payload.conversationId,
            userId,
            seq
          );
          io.to(conversationRoom(payload.conversationId)).emit("message:delivered", {
            conversationId: payload.conversationId,
            userId,
            deliveredUpToSeq,
          });
        } catch (error) {
          console.error("Delivered receipt error:", error);
        }
      }
    );

    //  Typing 
    // Membership-gated (rooms are only ever joined after a participant check),
    // so no DB hit per keystroke and no cross-conversation spoofing.
    const emitTyping = (conversationId: string, isTyping: boolean) => {
      if (!conversationId || !isMember(socket, conversationId)) return;

      socket.to(conversationRoom(conversationId)).emit(isTyping ? "typing:start" : "typing:stop", {
        conversationId,
        userId,
        name: socket.data.displayName,
        isTyping,
      });

      const key = typingKey(conversationId, userId);
      const existing = typingTimers.get(key);
      if (existing) clearTimeout(existing);

      if (isTyping) {
        typingTimers.set(
          key,
          setTimeout(() => {
            typingTimers.delete(key);
            io.to(conversationRoom(conversationId)).emit("typing:stop", {
              conversationId,
              userId,
              name: socket.data.displayName,
              isTyping: false,
            });
          }, CHAT_LIMITS.TYPING_TTL_MS)
        );
      } else {
        typingTimers.delete(key);
      }
    };

    socket.on("typing:start", (conversationId: string) => emitTyping(conversationId, true));
    socket.on("typing:stop", (conversationId: string) => emitTyping(conversationId, false));

    //  Teardown 
    // `disconnecting` fires while socket.rooms is still populated; `disconnect`
    // fires after Socket.IO has cleared them. Presence must go out here.
    socket.on("disconnecting", () => {
      const set = onlineSockets.get(userId);
      const goingOffline = !!set && set.size <= 1;
      if (!goingOffline) return;

      const lastSeenAt = new Date().toISOString();
      for (const id of socket.data.conversationIds) {
        clearTyping(io, id, userId, socket.data.displayName);
        socket.to(conversationRoom(id)).emit("presence:update", {
          userId,
          isOnline: false,
          lastSeenAt,
        });
      }
    });

    socket.on("disconnect", () => {
      const set = onlineSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) onlineSockets.delete(userId);
      }
    });
  });
}

/** Live presence lookup for the REST layer (thread header on first paint). */
export function isUserOnline(userId: number): boolean {
  return (onlineSockets.get(userId)?.size ?? 0) > 0;
}
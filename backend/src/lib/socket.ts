import { Server as SocketIOServer } from "socket.io";
import { ENV } from "./env.js";
import type { Server as HTTPServer } from "http";
import { registerChatHandlers } from "../modules/chat/sockets/chat.socket.js";

let io: SocketIOServer | null = null;

/** Room names live here so no caller ever hand-builds a room string. */
export const conversationRoom = (conversationId: string) => `conversation:${conversationId}`;
export const userRoom = (userId: number | string) => `user:${userId}`;

export function initializeSocketIO(httpServer: HTTPServer) {
  if (io) {
    console.warn("Socket.IO is already initialized.");
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:3000", ENV.CLIENT_URL].filter(Boolean) as string[],
      credentials: true,
    },
    // Transports must be explicit for some corporate proxies/firewalls.
    transports: ["websocket", "polling"],
    // Survive mobile backgrounding and flaky networks without dropping the session.
    pingInterval: 25_000,
    pingTimeout: 20_000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false, // always re-run auth: a revoked token must not resume
    },
  });

  // Redis adapter - OPTIONAL. Both modules are imported dynamically so a
  // single-instance deployment (no REDIS_URL, adapter not installed) can never
  // fail to boot. Previously the adapter was a static import, which made it a
  // hard dependency even when it was never used.
  if (ENV.REDIS_URL) {
    void (async () => {
      try {
        const [{ createAdapter }, { createClient }] = await Promise.all([
          import("@socket.io/redis-adapter"),
          import("redis"),
        ]);
        const pubClient = createClient({ url: ENV.REDIS_URL });
        const subClient = pubClient.duplicate();
        pubClient.on("error", (e) => console.error("[socket] redis pub error:", e));
        subClient.on("error", (e) => console.error("[socket] redis sub error:", e));
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io!.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO connected to Redis adapter for horizontal scaling.");
      } catch (error) {
        console.warn(
          "Redis adapter unavailable. Continuing in single-instance mode.",
          error
        );
      }
    })();
  } else {
    console.log("Redis URL not provided. Socket.IO running in single-instance mode.");
  }

  registerChatHandlers(io);

  console.log("Socket.IO initialized.");
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO has not been initialized. Call initializeSocketIO first.");
  }
  return io;
}

/**
 * Non-throwing accessor. Background workers and the LISTEN bridge must be able
 * to no-op during boot/shutdown instead of crashing the process.
 */
export function tryGetIO(): SocketIOServer | null {
  return io;
}

export function emitToConversation(conversationId: string, event: string, payload: unknown): void {
  tryGetIO()?.to(conversationRoom(conversationId)).emit(event, payload);
}

export function emitToUser(userId: number | string, event: string, payload: unknown): void {
  tryGetIO()?.to(userRoom(userId)).emit(event, payload);
}
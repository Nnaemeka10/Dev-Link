import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { ENV } from "./env.js";
import type { Server as HTTPServer } from "http";
import { registerChatHandlers } from "../modules/chat/sockets/chat.socket.js";

let io: SocketIOServer | null = null;

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
    // Transports must be explicitly defined for some corporate proxies/firewalls
    transports: ["websocket", "polling"],
  });

  // Redis Adapter Setup ─────────────────────────────────────
  // We check if Redis is configured. If not, we fall back to in-memory.
  // This allows horizontal scaling later without code changes.
  if (ENV.REDIS_URL) {
    try {
      // Dynamic import so local dev doesn't crash if 'redis' isn't installed yet
      import("redis").then(async ({ createClient }) => {
        const pubClient = createClient({ url: ENV.REDIS_URL });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);
        
        io!.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO connected to Redis adapter for horizontal scaling.");
      });
    } catch (error) {
      console.warn("Redis adapter failed to initialize. Falling back to single-instance mode.", error);
    }
  } else {
    console.log("Redis URL not provided. Socket.IO running in single-instance mode.");
  }

  //register socket event handlers for chat module
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
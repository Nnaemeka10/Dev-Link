import { verifyToken } from "../../../lib/utils.js";
import { ChatModel } from "../models/Chat.js";
export function registerChatHandlers(io) {
    // ─── Authentication Middleware for Socket.IO ───────────────────────────────
    io.use(async (socket, next) => {
        try {
            // Extract token from handshake auth or cookie
            const token = socket.handshake.auth.token ||
                socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
            if (!token) {
                return next(new Error("Authentication token required."));
            }
            const decoded = verifyToken(token);
            if (!decoded) {
                return next(new Error("Invalid or expired token."));
            }
            // Attach user to socket
            socket.user = decoded;
            next();
        }
        catch (error) {
            console.error("Socket auth error:", error);
            next(new Error("Authentication failed."));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.user;
        console.log(` User connected: ${user.userId} (Socket: ${socket.id})`);
        // ─── Join Conversation Room ───────────────────────────────────────────────
        socket.on("conversation:join", async (conversationId, callback) => {
            try {
                // Security: Validate user is a participant before joining
                const isParticipant = await ChatModel.isParticipant(conversationId, user.userId);
                if (!isParticipant) {
                    return callback(false);
                }
                socket.join(`conversation:${conversationId}`);
                console.log(`User ${user.userId} joined conversation:${conversationId}`);
                // Broadcast presence to the room
                socket.to(`conversation:${conversationId}`).emit("presence:update", {
                    userId: user.userId,
                    isOnline: true
                });
                callback(true);
            }
            catch (error) {
                console.error("Join conversation error:", error);
                callback(false);
            }
        });
        // ─── Send Message ─────────────────────────────────────────────────────────
        socket.on("message:send", async (payload, callback) => {
            try {
                // Security: Validate participant again
                const isParticipant = await ChatModel.isParticipant(payload.conversationId, user.userId);
                if (!isParticipant) {
                    return callback(null, "Forbidden: You are not in this conversation.");
                }
                // Save message to DB (handles sequence + idempotency)
                const message = await ChatModel.createMessage(payload.conversationId, user.userId, payload.clientId, payload.type, payload.body || null, payload.attachments);
                if (!message) {
                    return callback(null, "Failed to save message.");
                }
                // Acknowledge sender immediately (Optimistic UI will replace temp ID)
                callback(message, undefined);
                // NOTE: We DO NOT emit `message.created` here.
                // The Postgres LISTEN/NOTIFY bridge (listenBridge.ts) will catch the DB insert 
                // and emit `message.created` to the room automatically. 
                // This guarantees single source of truth and prevents double emissions.
            }
            catch (error) {
                console.error("Message send error:", error);
                callback(null, error.message || "Internal server error.");
            }
        });
        // ─── Read Receipts ────────────────────────────────────────────────────────
        socket.on("conversation:read", async (payload) => {
            try {
                await ChatModel.markAsRead(payload.conversationId, user.userId, payload.messageSeq);
                // Notify the room that messages up to this seq have been read
                socket.to(`conversation:${payload.conversationId}`).emit("message:read", {
                    conversationId: payload.conversationId,
                    readerId: user.userId,
                    readUpToSeq: payload.messageSeq
                });
            }
            catch (error) {
                console.error("Read receipt error:", error);
            }
        });
        // ─── Typing Indicators ────────────────────────────────────────────────────
        socket.on("typing:start", (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit("typing:start", {
                userId: user.userId,
                conversationId
            });
        });
        socket.on("typing:stop", (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit("typing:stop", {
                userId: user.userId,
                conversationId
            });
        });
        // ─── Disconnect ───────────────────────────────────────────────────────────
        socket.on("disconnect", () => {
            console.log(` User disconnected: ${user.userId} (Socket: ${socket.id})`);
            // Note: In a multi-instance environment, we would update Redis presence here.
            // For now, we rely on the user's other sockets or next connection to re-establish presence.
        });
    });
}
//# sourceMappingURL=chat.socket.js.map
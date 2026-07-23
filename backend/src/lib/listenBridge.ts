import { getDB } from "./db.js";
import { getIO } from "./socket.js";
import type { PostgresNotificationPayload } from "../modules/chat/types/chat.js";

let isListening = false;

export async function startPostgresListener() {
  if (isListening) {
    console.warn("Postgres LISTEN bridge is already running.");
    return;
  }

  const db = getDB();
  const client = await db.connect(); // Acquire a dedicated client for listening

  try {
    // Tell Postgres we want to listen to the 'chat_messages' channel
    await client.query("LISTEN chat_messages");
    isListening = true;
    console.log("Postgres LISTEN bridge started. Waiting for chat_messages notifications...");

    // Event listener for incoming notifications
    client.on("notification", (msg) => {
      if (!msg.payload) return;

      try {
        const payload: PostgresNotificationPayload = JSON.parse(msg.payload);
        const io = getIO();

        // Broadcast the raw notification payload to the specific conversation room.
        // The frontend/client will receive this and fetch the full hydrated message 
        // OR we can fetch it here before emitting. For performance, emitting the payload 
        // and letting the client fetch is often better, but emitting the full message 
        // is more convenient for the client. 
        // 
        // Architecture Decision: We emit the payload. The client will use React Query 
        // to optimistically add the message if it's the sender, or fetch the message 
        // details if it's the receiver. This keeps the socket layer extremely lightweight.
        
        io.to(`conversation:${payload.conversation_id}`).emit("message.created", payload);
        
      } catch (error) {
        console.error("Error parsing Postgres notification payload:", error);
      }
    });

  } catch (error) {
    console.error("Failed to start Postgres LISTEN bridge:", error);
    client.release(); // Release client if setup fails
    isListening = false;
  }
}
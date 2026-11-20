import { getDB } from "./db.js";
import { tryGetIO, conversationRoom, userRoom } from "./socket.js";
import { ChatModel } from "../modules/chat/models/Chat.js";
import type { PostgresNotificationPayload } from "../modules/chat/types/chat.js";
import type { PoolClient } from "pg";

/**
 * The ONE canonical fanout path for chat.
 *
 * Every message mutation - client send, edit, soft delete, and the system
 * message written by payment reconciliation - fires the Postgres trigger from
 * migration 036. This bridge hydrates the row and emits exactly one event
 * shape. The socket layer never emits messages itself, which permanently
 * removes the old double-emit bug (full Message from the socket + raw id
 * payload from the trigger, on the same event name).
 *
 * Two destinations per mutation:
 *   conversation:<id>  → an open thread renders it
 *   user:<participant> → the inbox and unread badges update WITHOUT the thread
 *                        being open. This is what lets a vendor see a new
 *                        inquiry arrive while sitting on the dashboard.
 */

let listening = false;
let stopping = false;
let activeClient: PoolClient | null = null;
let retryTimer: NodeJS.Timeout | null = null;
let attempt = 0;

const MAX_BACKOFF_MS = 30_000;

async function fanout(payload: PostgresNotificationPayload): Promise<void> {
  const io = tryGetIO();
  if (!io) return;

  // Rows from before migration 036 have no `op`; treat them as inserts.
  const op = payload.op ?? "created";
  const room = conversationRoom(payload.conversation_id);

  if (op === "deleted") {
    // Hard delete (cascade). The row is gone, so emit a minimal tombstone.
    io.to(room).emit("message.deleted", {
      id: Number(payload.message_id),
      conversation_id: payload.conversation_id,
      deleted_at: new Date().toISOString(),
    });
    return;
  }

  const message = await ChatModel.getMessageById(
    payload.conversation_id,
    Number(payload.message_id)
  );
  if (!message) return;

  // Soft delete arrives as an UPDATE; surface it as a delete so the client has
  // a single tombstone path. Body/attachments are already blanked by the model.
  const event =
    op === "created" ? "message.created" : message.deleted_at ? "message.deleted" : "message.updated";

  io.to(room).emit(event, message);

  const participantIds = await ChatModel.getParticipantIds(payload.conversation_id);
  for (const userId of participantIds) {
    io.to(userRoom(userId)).emit("inbox.updated", {
      conversationId: payload.conversation_id,
      message,
    });
  }
}

async function connectAndListen(): Promise<void> {
  if (stopping) return;

  const db = getDB();
  let client: PoolClient | null = null;

  try {
    client = await db.connect();
    activeClient = client;

    // A dropped connection must never leave us silently deaf: re-LISTEN with
    // backoff. The old implementation acquired a client once and never
    // recovered, so realtime died permanently after any network blip.
    client.on("error", (error) => {
      console.error("[listen-bridge] client error:", error);
      scheduleReconnect(client);
    });
    client.on("end", () => {
      console.warn("[listen-bridge] client ended.");
      scheduleReconnect(client);
    });

    client.on("notification", (msg) => {
      if (!msg.payload || msg.channel !== "chat_messages") return;
      try {
        const payload = JSON.parse(msg.payload) as PostgresNotificationPayload;
        void fanout(payload).catch((error) =>
          console.error("[listen-bridge] fanout failed:", error)
        );
      } catch (error) {
        console.error("[listen-bridge] bad notification payload:", error);
      }
    });

    await client.query("LISTEN chat_messages");
    listening = true;
    attempt = 0;
    console.log("Postgres LISTEN bridge started on 'chat_messages'.");
  } catch (error) {
    console.error("[listen-bridge] failed to start:", error);
    try {
      client?.release(true);
    } catch {
      /* already gone */
    }
    activeClient = null;
    listening = false;
    scheduleReconnect(null);
  }
}

function scheduleReconnect(deadClient: PoolClient | null): void {
  if (stopping || retryTimer) return;

  if (activeClient === deadClient || deadClient === null) {
    try {
      activeClient?.release(true);
    } catch {
      /* already gone */
    }
    activeClient = null;
    listening = false;
  }

  attempt += 1;
  const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
  console.warn(`[listen-bridge] reconnecting in ${delay}ms (attempt ${attempt}).`);

  retryTimer = setTimeout(() => {
    retryTimer = null;
    void connectAndListen();
  }, delay);
}

export async function startPostgresListener(): Promise<void> {
  if (listening) {
    console.warn("Postgres LISTEN bridge is already running.");
    return;
  }
  stopping = false;
  await connectAndListen();
}

export async function stopPostgresListener(): Promise<void> {
  stopping = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  try {
    await activeClient?.query("UNLISTEN chat_messages");
  } catch {
    /* connection already closed */
  }
  try {
    activeClient?.release();
  } catch {
    /* already gone */
  }
  activeClient = null;
  listening = false;
}
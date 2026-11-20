import { Request, Response } from 'express';
import { ChatModel } from '../models/Chat.js';
import { SupportAgentModel } from '../models/SupportAgents.js';
import { isUserOnline } from '../sockets/chat.socket.js';
import { emitToConversation, emitToUser } from '../../../lib/socket.js';
import cloudinary from '../../../lib/cloudinary.js';
import { ENV } from '../../../lib/env.js';
import {
  CHAT_LIMITS,
  ALLOWED_IMAGE_MIME,
  ALLOWED_FILE_MIME,
} from '../types/chat.js';

/** Sentinel errors from the model → HTTP. One map, used by every handler. */
const ERRORS: Record<string, { status: number; message: string }> = {
  LISTING_NOT_FOUND: { status: 404, message: 'Listing not found.' },
  LISTING_UNAVAILABLE: { status: 409, message: 'This listing is no longer available for new enquiries.' },
  BOOKING_NOT_FOUND: { status: 404, message: 'Booking not found.' },
  SELF_CHAT: { status: 400, message: 'You cannot message yourself.' },
  FORBIDDEN: { status: 403, message: 'You are not part of this conversation.' },
  MESSAGE_NOT_FOUND: { status: 404, message: 'Message not found.' },
  MESSAGE_DELETED: { status: 409, message: 'This message has been deleted.' },
  SYSTEM_MESSAGE_IMMUTABLE: { status: 403, message: 'System messages cannot be changed.' },
  EDIT_WINDOW_CLOSED: { status: 409, message: 'Messages can only be edited within 15 minutes of sending.' },
  EMPTY_MESSAGE: { status: 400, message: 'Write a message or attach a file.' },
  BODY_TOO_LONG: { status: 400, message: `Messages are limited to ${CHAT_LIMITS.MAX_BODY} characters.` },
  REPLY_TARGET_NOT_FOUND: { status: 404, message: 'The message you replied to no longer exists.' },
  TOO_MANY_ATTACHMENTS: { status: 400, message: `Up to ${CHAT_LIMITS.MAX_ATTACHMENTS} attachments per message.` },
  UNSUPPORTED_ATTACHMENT_TYPE: { status: 400, message: 'That file type is not supported.' },
  IMAGE_TOO_LARGE: { status: 400, message: 'Images must be 10 MB or smaller.' },
  FILE_TOO_LARGE: { status: 400, message: 'Files must be 25 MB or smaller.' },
  INVALID_ATTACHMENT_URL: { status: 400, message: 'That attachment failed to upload. Please try again.' },
  INVALID_ATTACHMENT_SIZE: { status: 400, message: 'That attachment failed to upload. Please try again.' },
  USER_NOT_FOUND: { status: 404, message: 'That user account does not exist.' },
  CANNOT_REMOVE_BOOTSTRAP: { status: 409, message: 'The primary support account cannot be removed.' },
};

function fail(res: Response, error: any, fallback: string): Response {
  const known = ERRORS[String(error?.message ?? '')];
  if (known) return res.status(known.status).json({ message: known.message, code: String(error.message) });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
}

function requireUser(req: Request, res: Response): number | null {
  if (!req.user?.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  return Number(req.user.userId);
}

async function assertParticipant(res: Response, conversationId: string, userId: number): Promise<boolean> {
  const ok = await ChatModel.isParticipant(conversationId, userId);
  if (!ok) {
    res.status(403).json({ message: 'You are not part of this conversation.' });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------
/**
 * GET /api/chat/conversations?role=guest|host&archived=true&limit=&cursor=
 *
 * `role` scopes DIRECT threads to the viewer's side of the marketplace; support
 * threads appear in every view. The support thread is created lazily here so it
 * exists the first time anyone opens their inbox - no signup hook, no cron.
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    await ChatModel.findOrCreateSupportConversation(userId);

    const rawRole = String(req.query.role ?? '').toLowerCase();
    const role = rawRole === 'host' || rawRole === 'guest' ? rawRole : null;

    const rawCursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
    let cursor: { at: string; id: string } | null = null;
    if (rawCursor?.includes('|')) {
      const [at, id] = rawCursor.split('|');
      if (at && id) cursor = { at, id };
    }

    const conversations = await ChatModel.getUserConversations(userId, {
      role,
      includeArchived: String(req.query.archived ?? '') === 'true',
      limit: Number(req.query.limit) || 50,
      cursor,
    });

    // Presence is process-local, so it is layered on here rather than stored.
    const withPresence = conversations.map((c) => ({
      ...c,
      counterparty_online: c.counterparty ? isUserOnline(c.counterparty.user_id) : false,
    }));

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(withPresence);
  } catch (error) {
    fail(res, error, 'Failed to fetch conversations');
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const conversation = await ChatModel.getConversation(req.params.id, userId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ...conversation,
      counterparty_online: conversation.counterparty ? isUserOnline(conversation.counterparty.user_id) : false,
    });
  } catch (error) {
    fail(res, error, 'Failed to fetch conversation');
  }
};

export const getUnreadSummary = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(await ChatModel.getUnreadSummary(userId));
  } catch (error) {
    fail(res, error, 'Failed to fetch unread counts');
  }
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const { id: conversationId } = req.params;
    if (!(await assertParticipant(res, conversationId, userId))) return;

    const direction = String(req.query.direction ?? 'before') === 'after' ? 'after' : 'before';
    const page = await ChatModel.getMessages(
      conversationId,
      typeof req.query.cursor === 'string' ? req.query.cursor : null,
      direction,
      Number(req.query.limit) || CHAT_LIMITS.PAGE_SIZE
    );

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(page);
  } catch (error) {
    fail(res, error, 'Failed to fetch messages');
  }
};

export const getMessageById = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const { id: conversationId, messageId } = req.params;
    if (!(await assertParticipant(res, conversationId, userId))) return;

    const message = await ChatModel.getMessageById(conversationId, Number(messageId));
    if (!message) return res.status(404).json({ message: 'Message not found.' });

    res.status(200).json(message);
  } catch (error) {
    fail(res, error, 'Failed to fetch message');
  }
};

/** PATCH /conversations/:id/messages/:messageId - own message, 15-minute cap. */
export const editMessage = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const { id: conversationId, messageId } = req.params;
    if (!(await assertParticipant(res, conversationId, userId))) return;

    const message = await ChatModel.editMessage(
      conversationId,
      Number(messageId),
      userId,
      String(req.body?.body ?? '')
    );

    // Broadcast is owned by the Postgres trigger → LISTEN bridge.
    res.status(200).json(message);
  } catch (error) {
    fail(res, error, 'Failed to edit message');
  }
};

/** DELETE /conversations/:id/messages/:messageId - soft delete, tombstone. */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const { id: conversationId, messageId } = req.params;
    if (!(await assertParticipant(res, conversationId, userId))) return;

    const message = await ChatModel.deleteMessage(conversationId, Number(messageId), userId);
    res.status(200).json(message);
  } catch (error) {
    fail(res, error, 'Failed to delete message');
  }
};

/** REST fallback for read receipts (socket is the primary path). */
export const markRead = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const conversationId = req.params.id;
    if (!(await assertParticipant(res, conversationId, userId))) return;

    const seq = Number(req.body?.seq);
    if (!Number.isFinite(seq) || seq <= 0) {
      return res.status(400).json({ message: 'A positive seq is required.' });
    }

    const readUpToSeq = await ChatModel.markAsRead(conversationId, userId, seq);
    emitToConversation(conversationId, 'message:read', { conversationId, readerId: userId, readUpToSeq });
    emitToUser(userId, 'conversation:read:sync', { conversationId, readUpToSeq });

    res.status(200).json({ readUpToSeq });
  } catch (error) {
    fail(res, error, 'Failed to mark as read');
  }
};

// ---------------------------------------------------------------------------
// Inbox controls
// ---------------------------------------------------------------------------
export const setArchived = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const conversationId = req.params.id;
    if (!(await assertParticipant(res, conversationId, userId))) return;

    const archived = req.body?.archived === true;
    await ChatModel.setArchived(conversationId, userId, archived);
    emitToUser(userId, 'inbox.updated', { conversationId, archived });

    res.status(200).json({ archived });
  } catch (error) {
    fail(res, error, 'Failed to update archive state');
  }
};

export const setMuted = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const conversationId = req.params.id;
    if (!(await assertParticipant(res, conversationId, userId))) return;

    const raw = req.body?.until;
    let until: string | null = null;
    if (raw !== null && raw !== undefined && raw !== '') {
      const parsed = new Date(String(raw));
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'until must be an ISO timestamp or null.' });
      }
      until = parsed.toISOString();
    }

    await ChatModel.setMuted(conversationId, userId, until);
    emitToUser(userId, 'inbox.updated', { conversationId, mutedUntil: until });

    res.status(200).json({ mutedUntil: until });
  } catch (error) {
    fail(res, error, 'Failed to update mute state');
  }
};

// ---------------------------------------------------------------------------
// Thread creation
// ---------------------------------------------------------------------------
/**
 * POST /api/chat/conversations
 *   { listingId }  → inquiry thread (no booking needed; vendor can reply)
 *   { bookingId }  → booking thread, openable by the guest OR the host
 *   { support: true } → the caller's support thread
 *
 * The FIRST booking on a listing adopts the open inquiry thread so pre-booking
 * history is preserved. Concurrent or later bookings get their own thread.
 */
export const createConversation = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    const { listingId, bookingId, support } = req.body ?? {};
    let conversationId: string;

    if (support === true) {
      conversationId = await ChatModel.findOrCreateSupportConversation(userId);
    } else if (bookingId) {
      conversationId = await ChatModel.resolveBookingConversation(String(bookingId), userId);
    } else if (listingId) {
      conversationId = await ChatModel.findOrCreateListingInquiry(String(listingId), userId);
    } else {
      return res.status(400).json({ message: 'Provide listingId, bookingId, or support: true.' });
    }

    const conversation = await ChatModel.getConversation(conversationId, userId);
    res.status(200).json({ id: conversationId, conversation });
  } catch (error) {
    fail(res, error, 'Failed to create conversation');
  }
};

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------
/**
 * Signed direct-to-Cloudinary upload. Caps and MIME allowlist are returned so
 * the client can reject early, and are re-enforced server-side when the message
 * is created - a signature alone cannot constrain bytes.
 */
export const generateUploadSignature = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;

    if (!ENV.CLOUDINARY_API_SECRET || !ENV.CLOUDINARY_API_KEY || !ENV.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ message: 'Cloudinary is not configured.' });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `eventvnv_chat_attachments/${userId}`;
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, ENV.CLOUDINARY_API_SECRET);

    res.status(200).json({
      signature,
      timestamp,
      folder,
      apiKey: ENV.CLOUDINARY_API_KEY,
      cloudName: ENV.CLOUDINARY_CLOUD_NAME,
      limits: {
        maxAttachments: CHAT_LIMITS.MAX_ATTACHMENTS,
        imageMaxBytes: CHAT_LIMITS.IMAGE_MAX_BYTES,
        fileMaxBytes: CHAT_LIMITS.FILE_MAX_BYTES,
        allowedImageMime: ALLOWED_IMAGE_MIME,
        allowedFileMime: ALLOWED_FILE_MIME,
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to generate upload signature');
  }
};

// ---------------------------------------------------------------------------
// Support agents
// ---------------------------------------------------------------------------
async function assertAgent(res: Response, userId: number): Promise<boolean> {
  const ok = await SupportAgentModel.isAgent(userId);
  if (!ok) res.status(403).json({ message: 'Support agent access required.' });
  return ok;
}

export const listSupportAgents = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;
    if (!(await assertAgent(res, userId))) return;
    res.status(200).json(await SupportAgentModel.list());
  } catch (error) {
    fail(res, error, 'Failed to fetch support agents');
  }
};

export const addSupportAgent = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;
    if (!(await assertAgent(res, userId))) return;

    const target = Number(req.body?.userId);
    if (!Number.isFinite(target) || target <= 0) {
      return res.status(400).json({ message: 'A valid userId is required.' });
    }

    await SupportAgentModel.add(target, userId);
    res.status(201).json(await SupportAgentModel.list());
  } catch (error) {
    fail(res, error, 'Failed to add support agent');
  }
};

export const removeSupportAgent = async (req: Request, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (userId === null) return;
    if (!(await assertAgent(res, userId))) return;

    const target = Number(req.params.userId);
    if (!Number.isFinite(target) || target <= 0) {
      return res.status(400).json({ message: 'A valid userId is required.' });
    }

    await SupportAgentModel.remove(target);
    res.status(200).json(await SupportAgentModel.list());
  } catch (error) {
    fail(res, error, 'Failed to remove support agent');
  }
};
// Thread model (one rule, no ambiguity):
//   inquiry thread  = (listing_id, guest_id) with booking_id IS NULL
//   booking thread  = (booking_id)                       [unique since 028]
// On payment, the FIRST booking claims the open inquiry thread so pre-booking
// history is preserved. Every later booking - concurrent or months later -
// gets a fresh thread. A thread carries at most one booking; a booking has
// exactly one thread. Both invariants are enforced by partial unique indexes.

import { getDB } from '../../../lib/db.js';
import type { PoolClient } from 'pg';
import crypto from 'crypto';
import { SupportAgentModel } from './SupportAgents.js';
import { detectOffPlatform, type ModerationResult } from '../utils/moderation.js';
import {
  CHAT_LIMITS,
  ALLOWED_IMAGE_MIME,
  ALLOWED_FILE_MIME,
  type AttachmentInput,
  type AttachmentKind,
  type ConversationView,
  type Message,
  type MessagePage,
  type MessageType,
  type ParticipantRole,
  type UnreadSummary,
} from '../types/chat.js';

const SYSTEM_NAMESPACE = '5935b5ee-7c80-4e4f-9140-5da756a08111';

function uuidV5(namespace: string, name: string): string {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const nameBytes = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBytes, nameBytes])).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.toString('hex', 0, 16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function systemMessageKey(bookingId: string): string {
  return uuidV5(SYSTEM_NAMESPACE, `system-booking-${bookingId}`);
}

export function attachmentKind(mime: string): AttachmentKind {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

/** Server-side attachment gate. The client's own checks are UX, not security. */
function validateAttachments(attachments: AttachmentInput[]): void {
  if (attachments.length > CHAT_LIMITS.MAX_ATTACHMENTS) {
    throw new Error('TOO_MANY_ATTACHMENTS');
  }
  for (const a of attachments) {
    const mime = String(a.mime_type || '').toLowerCase();
    const size = Number(a.size);
    const isImage = (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);
    const isFile = (ALLOWED_FILE_MIME as readonly string[]).includes(mime);

    if (!isImage && !isFile) throw new Error('UNSUPPORTED_ATTACHMENT_TYPE');
    if (!Number.isFinite(size) || size <= 0) throw new Error('INVALID_ATTACHMENT_SIZE');
    if (isImage && size > CHAT_LIMITS.IMAGE_MAX_BYTES) throw new Error('IMAGE_TOO_LARGE');
    if (!isImage && size > CHAT_LIMITS.FILE_MAX_BYTES) throw new Error('FILE_TOO_LARGE');
    if (!/^https:\/\/res\.cloudinary\.com\//.test(String(a.url || ''))) {
      throw new Error('INVALID_ATTACHMENT_URL');
    }
  }
}

// ---------------------------------------------------------------------------
// Message hydration. LATERAL aggregates avoid GROUP BY entirely, which matters
// because the reply preview is JSON (json has no equality operator).
// Deleted messages keep their row so ordering and replies stay intact, but
// their content is blanked here - deleted text never leaves the database.
// ---------------------------------------------------------------------------
const MESSAGE_SELECT = `
  SELECT
    m.id, m.conversation_id, m.sender_id, m.conversation_seq, m.client_id,
    m.type, m.created_at, m.edited_at, m.deleted_at, m.reply_to_message_id,
    CASE WHEN m.deleted_at IS NULL THEN m.body ELSE NULL END AS body,
    att.attachments,
    rp.preview AS reply_preview
  FROM messages m
  LEFT JOIN LATERAL (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', a.id, 'message_id', a.message_id, 'url', a.url,
          'mime_type', a.mime_type, 'size', a.size,
          'width', a.width, 'height', a.height, 'duration', a.duration
        ) ORDER BY a.created_at
      ), '[]'
    ) AS attachments
    FROM message_attachments a
    WHERE a.message_id = m.id AND m.deleted_at IS NULL
  ) att ON TRUE
  LEFT JOIN LATERAL (
    SELECT json_build_object(
      'id', rm.id,
      'seq', rm.conversation_seq,
      'sender_id', rm.sender_id,
      'sender_name', NULLIF(TRIM(COALESCE(ru.first_name,'') || ' ' || COALESCE(ru.last_name,'')), ''),
      'type', rm.type,
      'body', CASE WHEN rm.deleted_at IS NULL THEN LEFT(COALESCE(rm.body,''), 160) ELSE NULL END,
      'deleted', rm.deleted_at IS NOT NULL,
      'has_attachments', EXISTS (SELECT 1 FROM message_attachments ra WHERE ra.message_id = rm.id)
    ) AS preview
    FROM messages rm
    JOIN users ru ON ru.id = rm.sender_id
    WHERE rm.id = m.reply_to_message_id
  ) rp ON TRUE
`;

function mapMessage(row: any): Message {
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];
  const preview = row.reply_preview
    ? { ...row.reply_preview, sender_name: row.reply_preview.sender_name || 'Guest' }
    : null;
  return {
    id: Number(row.id),
    conversation_id: row.conversation_id,
    sender_id: Number(row.sender_id),
    conversation_seq: Number(row.conversation_seq),
    client_id: row.client_id ?? null,
    type: row.type,
    body: row.body ?? null,
    created_at: row.created_at,
    edited_at: row.edited_at ?? null,
    deleted_at: row.deleted_at ?? null,
    reply_to_message_id: row.reply_to_message_id != null ? Number(row.reply_to_message_id) : null,
    attachments: attachments.map((a: any) => ({
      ...a,
      size: Number(a.size),
      kind: attachmentKind(String(a.mime_type || '')),
    })),
    reply_preview: preview,
  };
}

// ---------------------------------------------------------------------------
// Conversation hydration. $1 is always the viewing user.
// `other` picks exactly ONE counterparty via LATERAL - the old LEFT JOIN fanned
// out to N rows per thread, which would have broken the moment support had
// more than one agent.
//
// SUPPORT IS ROLE-AWARE. The same row is two different conversations depending
// on who reads it:
//   customer (cp.role = 'guest')  -> "EventVnV Support", no counterparty email
//   agent    (cp.role = 'support')-> the CUSTOMER's name, id and email
// Hardcoding "EventVnV Support" for both made every thread in the agent's inbox
// carry the same label. The email is gated on the agent role so a buyer↔vendor
// thread can never hand out the other party's address.
// ---------------------------------------------------------------------------
const CONVERSATION_SELECT = `
  SELECT
    c.id, c.type, c.created_at, c.updated_at, c.last_message_at,
    ctx.type AS context_type,
    cp.role AS my_role,
    cp.last_read_seq, cp.delivered_seq, cp.archived_at, cp.muted_until,
    (c.type = 'support') AS is_support,
    other.user_id AS other_user_id,
    other.first_name AS other_first_name,
    other.last_name AS other_last_name,
    other.avatar_url AS other_avatar_url,
    CASE
      WHEN c.type = 'support' AND cp.role = 'support' THEN other.email
      ELSE NULL
    END AS other_email,
    CASE
      WHEN c.type = 'support' AND cp.role <> 'support' THEN 'EventVnV Support'
      WHEN NULLIF(TRIM(COALESCE(other.first_name,'') || ' ' || COALESCE(other.last_name,'')), '') IS NOT NULL
        THEN TRIM(COALESCE(other.first_name,'') || ' ' || COALESCE(other.last_name,''))
      WHEN other.email IS NOT NULL THEN split_part(other.email, '@', 1)
      WHEN c.type = 'support' AND cp.role = 'support' AND other.user_id IS NOT NULL
        THEN 'User #' || other.user_id::text
      ELSE 'Guest'
    END AS display_name,
    l.id AS l_id, l.title AS l_title, l.kind AS l_kind,
    l.base_price_kobo AS l_price, l.price_unit AS l_unit, l.status AS l_status,
    NULLIF(CONCAT_WS(', ', NULLIF(l.city,''), NULLIF(l.state,'')), '') AS l_location,
    (SELECT la.url FROM listing_assets la
      WHERE la.listing_id = l.id
      ORDER BY la.is_primary DESC, la.sort_order ASC LIMIT 1) AS l_image,
    b.id AS b_id, b.booking_reference AS b_ref, b.status AS b_status,
    to_char(b.start_date,'YYYY-MM-DD') AS b_start,
    to_char(b.end_date,'YYYY-MM-DD') AS b_end,
    (SELECT COALESCE(json_agg(to_char(d,'YYYY-MM-DD') ORDER BY d), '[]')
       FROM unnest(b.excluded_dates) AS d) AS b_excluded,
    b.start_time AS b_start_time, b.end_time AS b_end_time,
    b.guests AS b_guests, b.total_amount AS b_total, b.currency AS b_currency,
    b.event_location AS b_event_location,
    sp.name AS b_package,
    lm.preview AS last_message,
    pc.participants,
    (SELECT COUNT(*) FROM messages m
      WHERE m.conversation_id = c.id
        AND m.conversation_seq > cp.last_read_seq
        AND m.deleted_at IS NULL
        AND (m.sender_id <> $1 OR m.type = 'system'))::int AS unread_count
  FROM conversations c
  JOIN conversation_participants cp
    ON cp.conversation_id = c.id AND cp.user_id = $1 AND cp.left_at IS NULL
  LEFT JOIN conversation_context ctx ON ctx.conversation_id = c.id
  LEFT JOIN listings l ON l.id = ctx.listing_id
  LEFT JOIN bookings b ON b.id = ctx.booking_id
  LEFT JOIN service_packages sp ON sp.id = b.package_id
  LEFT JOIN LATERAL (
    SELECT u.id AS user_id, u.first_name, u.last_name, u.avatar_url, u.email, cp2.role
    FROM conversation_participants cp2
    JOIN users u ON u.id = cp2.user_id
    WHERE cp2.conversation_id = c.id AND cp2.user_id <> $1 AND cp2.left_at IS NULL
    ORDER BY (cp2.role = 'support') ASC, cp2.joined_at ASC
    LIMIT 1
  ) other ON TRUE
  LEFT JOIN LATERAL (
    SELECT json_build_object(
      'id', m.id, 'seq', m.conversation_seq, 'sender_id', m.sender_id,
      'type', m.type,
      'body', CASE WHEN m.deleted_at IS NULL THEN LEFT(COALESCE(m.body,''), 200) ELSE NULL END,
      'deleted', m.deleted_at IS NOT NULL,
      'has_attachments', EXISTS (SELECT 1 FROM message_attachments a WHERE a.message_id = m.id),
      'created_at', m.created_at
    ) AS preview
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.conversation_seq DESC
    LIMIT 1
  ) lm ON TRUE
  LEFT JOIN LATERAL (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'user_id', u.id, 'role', cp2.role,
          'first_name', u.first_name, 'last_name', u.last_name, 'avatar_url', u.avatar_url,
          'last_read_seq', cp2.last_read_seq, 'delivered_seq', cp2.delivered_seq
        ) ORDER BY cp2.joined_at
      ), '[]'
    ) AS participants
    FROM conversation_participants cp2
    JOIN users u ON u.id = cp2.user_id
    WHERE cp2.conversation_id = c.id AND cp2.left_at IS NULL
  ) pc ON TRUE
`;

function mapConversation(row: any): ConversationView {
  const listing = row.l_id
    ? {
        id: row.l_id,
        title: row.l_title,
        kind: row.l_kind,
        image_url: row.l_image ?? null,
        location: row.l_location ?? null,
        price_from_kobo: Number(row.l_price ?? 0),
        price_unit: row.l_unit ?? 'per event',
        status: row.l_status,
      }
    : null;

  const booking = row.b_id
    ? {
        id: row.b_id,
        reference: row.b_ref,
        status: row.b_status,
        start_date: row.b_start,
        end_date: row.b_end,
        excluded_dates: Array.isArray(row.b_excluded) ? row.b_excluded : [],
        start_time: row.b_start_time ?? null,
        end_time: row.b_end_time ?? null,
        guests: Number(row.b_guests ?? 1),
        total_amount: Number(row.b_total ?? 0),
        currency: row.b_currency ?? 'NGN',
        package_name: row.b_package ?? null,
        event_location: row.b_event_location ?? null,
      }
    : null;

  return {
    id: row.id,
    type: row.type,
    my_role: row.my_role,
    is_support: row.is_support === true,
    context_type: row.context_type ?? null,
    display_name: row.display_name,
    counterparty: row.other_user_id
      ? {
          user_id: Number(row.other_user_id),
          first_name: row.other_first_name ?? null,
          last_name: row.other_last_name ?? null,
          avatar_url: row.other_avatar_url ?? null,
          // Non-null ONLY for an agent reading a support thread. The SQL gate
          // is the authority; this never widens it.
          email: row.other_email ?? null,
        }
      : null,
    listing,
    booking,
    participants: (Array.isArray(row.participants) ? row.participants : []).map((p: any) => ({
      ...p,
      user_id: Number(p.user_id),
      last_read_seq: Number(p.last_read_seq ?? 0),
      delivered_seq: Number(p.delivered_seq ?? 0),
    })),
    unread_count: Number(row.unread_count ?? 0),
    last_read_seq: Number(row.last_read_seq ?? 0),
    delivered_seq: Number(row.delivered_seq ?? 0),
    archived_at: row.archived_at ?? null,
    muted_until: row.muted_until ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_message_at: row.last_message_at ?? null,
    last_message: row.last_message ?? null,
  };
}

export const ChatModel = {
  // =========================================================================
  // Access
  // =========================================================================
  async isParticipant(conversationId: string, userId: number): Promise<boolean> {
    const db = getDB();
    const res = await db.query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );
    return res.rows.length > 0;
  },

  async getMyRole(conversationId: string, userId: number): Promise<ParticipantRole | null> {
    const db = getDB();
    const res = await db.query(
      `SELECT role FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );
    return res.rows[0]?.role ?? null;
  },

  async getParticipantIds(conversationId: string): Promise<number[]> {
    const db = getDB();
    const res = await db.query(
      `SELECT user_id FROM conversation_participants
       WHERE conversation_id = $1 AND left_at IS NULL`,
      [conversationId]
    );
    return res.rows.map((r: any) => Number(r.user_id));
  },

  /** Every conversation this user belongs to - used for per-user socket rooms. */
  async getConversationIdsForUser(userId: number): Promise<string[]> {
    const db = getDB();
    const res = await db.query(
      `SELECT conversation_id FROM conversation_participants
       WHERE user_id = $1 AND left_at IS NULL`,
      [userId]
    );
    return res.rows.map((r: any) => r.conversation_id);
  },

  // =========================================================================
  // Inbox
  // =========================================================================
  /**
   * Role-scoped inbox. `role` filters DIRECT threads by the viewer's role;
   * support threads appear in every view because support is role-agnostic.
   * One row per conversation, always.
   */
  async getUserConversations(
    userId: number,
    opts: {
      role?: 'host' | 'guest' | null;
      includeArchived?: boolean;
      limit?: number;
      cursor?: { at: string; id: string } | null;
    } = {}
  ): Promise<ConversationView[]> {
    const db = getDB();
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), CHAT_LIMITS.MAX_PAGE_SIZE);
    const params: any[] = [userId, opts.role ?? null, opts.includeArchived === true];

    let sql = `${CONVERSATION_SELECT}
      WHERE ($2::text IS NULL OR c.type = 'support' OR cp.role = $2)
        AND ($3::boolean OR cp.archived_at IS NULL)`;

    if (opts.cursor?.at && opts.cursor?.id) {
      params.push(opts.cursor.at, opts.cursor.id);
      sql += ` AND (COALESCE(c.last_message_at, c.created_at), c.id) < ($4::timestamptz, $5::uuid)`;
    }

    sql += ` ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await db.query(sql, params);
    return res.rows.map(mapConversation);
  },

  async getConversation(conversationId: string, userId: number): Promise<ConversationView | null> {
    const db = getDB();
    const res = await db.query(`${CONVERSATION_SELECT} AND c.id = $2`, [userId, conversationId]);
    return res.rows[0] ? mapConversation(res.rows[0]) : null;
  },

  async getUnreadSummary(userId: number): Promise<UnreadSummary> {
    const db = getDB();
    const res = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN c.type = 'support' THEN u.n ELSE 0 END), 0)::int AS support,
         COALESCE(SUM(CASE WHEN c.type <> 'support' AND cp.role = 'guest' THEN u.n ELSE 0 END), 0)::int AS guest,
         COALESCE(SUM(CASE WHEN c.type <> 'support' AND cp.role = 'host' THEN u.n ELSE 0 END), 0)::int AS host,
         COALESCE(SUM(u.n), 0)::int AS total
       FROM conversation_participants cp
       JOIN conversations c ON c.id = cp.conversation_id
       JOIN LATERAL (
         SELECT COUNT(*) AS n FROM messages m
         WHERE m.conversation_id = c.id
           AND m.conversation_seq > cp.last_read_seq
           AND m.deleted_at IS NULL
           AND (m.sender_id <> cp.user_id OR m.type = 'system')
       ) u ON TRUE
       WHERE cp.user_id = $1 AND cp.left_at IS NULL AND cp.archived_at IS NULL`,
      [userId]
    );
    const r = res.rows[0] ?? { total: 0, guest: 0, host: 0, support: 0 };
    return { total: Number(r.total), guest: Number(r.guest), host: Number(r.host), support: Number(r.support) };
  },

  async setArchived(conversationId: string, userId: number, archived: boolean): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE conversation_participants
       SET archived_at = CASE WHEN $3::boolean THEN NOW() ELSE NULL END
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, archived]
    );
  },

  async setMuted(conversationId: string, userId: number, until: string | null): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE conversation_participants SET muted_until = $3::timestamptz
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, until]
    );
  },

  // =========================================================================
  // Thread creation
  // =========================================================================
  /**
   * Inquiry thread for (listing, guest) - no booking required, so a customer
   * can ask questions and the vendor can reply before any money moves.
   */
  async findOrCreateListingInquiry(listingId: string, guestId: number): Promise<string> {
    const db = getDB();
    const listing = await db.query(
      `SELECT id, vendor_id, status FROM listings WHERE id = $1 AND deleted_at IS NULL`,
      [listingId]
    );
    if (listing.rows.length === 0) throw new Error('LISTING_NOT_FOUND');

    const vendorId = Number(listing.rows[0].vendor_id);
    if (vendorId === Number(guestId)) throw new Error('SELF_CHAT');

    // Visible listings are open for inquiry. An unlisted/suspended listing is
    // still chattable by someone who actually booked it - otherwise a vendor
    // unlisting would cut off a customer with a live event.
    const visible = ['published', 'pending_review'].includes(listing.rows[0].status);
    if (!visible) {
      const booked = await db.query(
        `SELECT 1 FROM bookings WHERE listing_id = $1 AND user_id = $2 LIMIT 1`,
        [listingId, guestId]
      );
      if (booked.rows.length === 0) throw new Error('LISTING_UNAVAILABLE');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtext($1))`,
        [`inquiry:${listingId}:${guestId}`]
      );

      const existing = await client.query(
        `SELECT conversation_id FROM conversation_context
         WHERE listing_id = $1 AND guest_id = $2 AND booking_id IS NULL AND type = 'listing'
         LIMIT 1`,
        [listingId, guestId]
      );
      if (existing.rows.length > 0) {
        const id = existing.rows[0].conversation_id;
        await this.ensureParticipants(client, id, guestId, vendorId);
        await client.query('COMMIT');
        return id;
      }

      const conv = await client.query(
        `INSERT INTO conversations (type) VALUES ('direct') RETURNING id`
      );
      const convId = conv.rows[0].id;
      await this.ensureParticipants(client, convId, guestId, vendorId);
      await client.query(
        `INSERT INTO conversation_context (conversation_id, listing_id, guest_id, type)
         VALUES ($1, $2, $3, 'listing')`,
        [convId, listingId, guestId]
      );

      await client.query('COMMIT');
      return convId;
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => {});
      if (error?.code === '23505') {
        const winner = await db.query(
          `SELECT conversation_id FROM conversation_context
           WHERE listing_id = $1 AND guest_id = $2 AND booking_id IS NULL AND type = 'listing'`,
          [listingId, guestId]
        );
        if (winner.rows.length > 0) return winner.rows[0].conversation_id;
      }
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Booking thread. Openable by the guest OR the host - the vendor tapping
   * "Chat with client" resolves the SAME thread the customer is in.
   *
   * Claim rule: the first booking adopts the open inquiry thread; every later
   * booking gets a fresh one. Serialized per (listing, guest) so two concurrent
   * payments can never adopt the same inquiry.
   */
  async resolveBookingConversation(bookingId: string, requesterId: number): Promise<string> {
    const db = getDB();
    const booking = await db.query(
      `SELECT b.id, b.user_id, b.listing_id, l.vendor_id
       FROM bookings b JOIN listings l ON l.id = b.listing_id
       WHERE b.id = $1`,
      [bookingId]
    );
    if (booking.rows.length === 0) throw new Error('BOOKING_NOT_FOUND');

    const guestId = Number(booking.rows[0].user_id);
    const vendorId = Number(booking.rows[0].vendor_id);
    const listingId = booking.rows[0].listing_id;
    const requester = Number(requesterId);
    if (requester !== guestId && requester !== vendorId) throw new Error('FORBIDDEN');

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtext($1))`,
        [`booking-claim:${listingId}:${guestId}`]
      );

      const bound = await client.query(
        `SELECT conversation_id FROM conversation_context WHERE booking_id = $1 LIMIT 1`,
        [bookingId]
      );
      if (bound.rows.length > 0) {
        const id = bound.rows[0].conversation_id;
        await this.ensureParticipants(client, id, guestId, vendorId);
        await client.query('COMMIT');
        return id;
      }

      const inquiry = await client.query(
        `SELECT conversation_id FROM conversation_context
         WHERE listing_id = $1 AND guest_id = $2 AND booking_id IS NULL AND type = 'listing'
         LIMIT 1 FOR UPDATE`,
        [listingId, guestId]
      );

      if (inquiry.rows.length > 0) {
        const id = inquiry.rows[0].conversation_id;
        await client.query(
          `UPDATE conversation_context SET booking_id = $2, type = 'booking'
           WHERE conversation_id = $1`,
          [id, bookingId]
        );
        await this.ensureParticipants(client, id, guestId, vendorId);
        await client.query('COMMIT');
        return id;
      }

      const conv = await client.query(
        `INSERT INTO conversations (type) VALUES ('direct') RETURNING id`
      );
      const convId = conv.rows[0].id;
      await this.ensureParticipants(client, convId, guestId, vendorId);
      await client.query(
        `INSERT INTO conversation_context (conversation_id, listing_id, booking_id, guest_id, type)
         VALUES ($1, $2, $3, $4, 'booking')`,
        [convId, listingId, bookingId, guestId]
      );

      await client.query('COMMIT');
      return convId;
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => {});
      // Lost a create race for this booking - adopt the winner. This runs inside
      // payment reconciliation, so it must never 500 a paid booking.
      if (error?.code === '23505') {
        const winner = await db.query(
          `SELECT conversation_id FROM conversation_context WHERE booking_id = $1`,
          [bookingId]
        );
        if (winner.rows.length > 0) return winner.rows[0].conversation_id;
      }
      throw error;
    } finally {
      client.release();
    }
  },

  /** Idempotent participant top-up. Also heals threads created before a fix. */
  async ensureParticipants(
    client: PoolClient,
    conversationId: string,
    guestId: number,
    hostId: number
  ): Promise<void> {
    if (Number(guestId) === Number(hostId)) {
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
         VALUES ($1, $2, 'guest') ON CONFLICT (conversation_id, user_id) DO NOTHING`,
        [conversationId, guestId]
      );
      return;
    }
    await client.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, 'guest'), ($1, $3, 'host')
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conversationId, guestId, hostId]
    );
  },

  /**
   * One support thread per user, created lazily on first inbox load.
   * Every active agent is a participant, so the support account sees it in its
   * normal inbox with no special-casing anywhere downstream.
   */
  async findOrCreateSupportConversation(userId: number): Promise<string> {
    await SupportAgentModel.ensureBootstrap();
    const agentIds = (await SupportAgentModel.ids()).filter((id) => id !== Number(userId));

    const db = getDB();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`support:${userId}`]);

      const existing = await client.query(
        `SELECT conversation_id FROM conversation_context
         WHERE type = 'support' AND guest_id = $1 LIMIT 1`,
        [userId]
      );

      let convId: string;
      if (existing.rows.length > 0) {
        convId = existing.rows[0].conversation_id;
      } else {
        const conv = await client.query(
          `INSERT INTO conversations (type) VALUES ('support') RETURNING id`
        );
        convId = conv.rows[0].id;
        await client.query(
          `INSERT INTO conversation_context (conversation_id, guest_id, type)
           VALUES ($1, $2, 'support')`,
          [convId, userId]
        );
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role)
           VALUES ($1, $2, 'guest') ON CONFLICT (conversation_id, user_id) DO NOTHING`,
          [convId, userId]
        );
      }

      // Self-heal: agents added since this thread was created join it now.
      if (agentIds.length > 0) {
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role)
           SELECT $1, unnest($2::bigint[]), 'support'
           ON CONFLICT (conversation_id, user_id) DO UPDATE SET left_at = NULL`,
          [convId, agentIds]
        );
      }

      await client.query('COMMIT');
      return convId;
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => {});
      if (error?.code === '23505') {
        const winner = await db.query(
          `SELECT conversation_id FROM conversation_context WHERE type = 'support' AND guest_id = $1`,
          [userId]
        );
        if (winner.rows.length > 0) return winner.rows[0].conversation_id;
      }
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Post-payment system message. Lands in the SAME thread the inquiry lived in.
   * sender_id remains the guest (messages.sender_id is a NOT NULL FK to users),
   * but type='system' means the UI renders it centred and unattributed, and
   * unread counts include system rows for EVERY participant - so the customer
   * still gets a badge for their own confirmation.
   */
  async createBookingSystemMessage(
    bookingId: string,
    userId: number,
    _vendorId: number,
    listingImage: string | null,
    listingTitle: string
  ): Promise<void> {
    const conversationId = await this.resolveBookingConversation(bookingId, userId);
    const body = `Booking confirmed. Your reservation for ${listingTitle} is secured - you can now coordinate details here.`;

    await this.createMessage(
      conversationId,
      userId,
      systemMessageKey(bookingId),
      'system',
      body,
      listingImage
        ? [{ url: listingImage, mime_type: 'image/jpeg', size: 1, width: 400, height: 300 }]
        : []
    );
  },

  // =========================================================================
  // Messages
  // =========================================================================
  async getMessages(
    conversationId: string,
    cursor?: string | null,
    direction: 'before' | 'after' = 'before',
    limit: number = CHAT_LIMITS.PAGE_SIZE
  ): Promise<MessagePage> {
    const db = getDB();
    const safeLimit = Math.min(Math.max(Number(limit) || CHAT_LIMITS.PAGE_SIZE, 1), CHAT_LIMITS.MAX_PAGE_SIZE);
    const params: any[] = [conversationId];
    let sql = `${MESSAGE_SELECT} WHERE m.conversation_id = $1`;

    // A malformed cursor must never reach Postgres as NaN.
    const seq = cursor != null && cursor !== '' ? Number(cursor) : NaN;
    if (Number.isFinite(seq)) {
      params.push(seq);
      sql += direction === 'before' ? ` AND m.conversation_seq < $2` : ` AND m.conversation_seq > $2`;
    }

    sql += ` ORDER BY m.conversation_seq ${direction === 'before' ? 'DESC' : 'ASC'} LIMIT $${params.length + 1}`;
    params.push(safeLimit + 1);

    const res = await db.query(sql, params);
    const hasMore = res.rows.length > safeLimit;
    const rows = hasMore ? res.rows.slice(0, safeLimit) : res.rows;
    const messages = rows.map(mapMessage);
    return { messages: direction === 'before' ? messages.reverse() : messages, has_more: hasMore };
  },

  async getMessageById(conversationId: string, messageId: number): Promise<Message | null> {
    const db = getDB();
    const res = await db.query(`${MESSAGE_SELECT} WHERE m.conversation_id = $1 AND m.id = $2`, [
      conversationId,
      messageId,
    ]);
    return res.rows[0] ? mapMessage(res.rows[0]) : null;
  },

  /** Highest seq in a conversation - the client's reconnect resume point. */
  async getLatestSeq(conversationId: string): Promise<number> {
    const db = getDB();
    const res = await db.query(
      `SELECT COALESCE(MAX(conversation_seq), 0)::bigint AS seq FROM messages WHERE conversation_id = $1`,
      [conversationId]
    );
    return Number(res.rows[0]?.seq ?? 0);
  },

  /**
   * Idempotent send. The duplicate check runs BEFORE a sequence is allocated so
   * retries no longer burn seq values, and the duplicate path returns the same
   * hydrated shape as the happy path (the old one dropped attachments).
   */
  async createMessage(
    conversationId: string,
    senderId: number,
    clientId: string,
    type: MessageType,
    body: string | null,
    attachments: AttachmentInput[] = [],
    replyToMessageId: number | null = null,
    moderation?: ModerationResult | null
  ): Promise<Message | null> {
    const db = getDB();
    const trimmed = typeof body === 'string' ? body.trim() : null;
    const safeBody = trimmed ? trimmed.slice(0, CHAT_LIMITS.MAX_BODY) : null;

    if (!safeBody && attachments.length === 0 && type !== 'system') {
      throw new Error('EMPTY_MESSAGE');
    }
    validateAttachments(attachments);

    const effectiveType: MessageType =
      type === 'system'
        ? 'system'
        : attachments.length > 0
          ? attachments.every((a) => a.mime_type.startsWith('image/')) ? 'image' : 'file'
          : 'text';

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const dup = await client.query(
        `SELECT id FROM messages WHERE client_id = $1 AND sender_id = $2 LIMIT 1`,
        [clientId, senderId]
      );
      if (dup.rows.length > 0) {
        await client.query('ROLLBACK');
        return this.getMessageById(conversationId, Number(dup.rows[0].id));
      }

      if (replyToMessageId != null) {
        const target = await client.query(
          `SELECT 1 FROM messages WHERE id = $1 AND conversation_id = $2`,
          [replyToMessageId, conversationId]
        );
        if (target.rows.length === 0) throw new Error('REPLY_TARGET_NOT_FOUND');
      }

      const seqRes = await client.query('SELECT get_next_conversation_seq($1) AS seq', [conversationId]);
      const seq = Number(seqRes.rows[0].seq);

      const inserted = await client.query(
        `INSERT INTO messages
           (conversation_id, sender_id, conversation_seq, client_id, type, body, reply_to_message_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (client_id, sender_id) DO NOTHING
         RETURNING id`,
        [conversationId, senderId, seq, clientId, effectiveType, safeBody, replyToMessageId]
      );

      if (inserted.rows.length === 0) {
        await client.query('ROLLBACK');
        const again = await db.query(
          `SELECT id FROM messages WHERE client_id = $1 AND sender_id = $2`,
          [clientId, senderId]
        );
        return again.rows[0] ? this.getMessageById(conversationId, Number(again.rows[0].id)) : null;
      }

      const messageId = Number(inserted.rows[0].id);

      for (const a of attachments) {
        await client.query(
          `INSERT INTO message_attachments (message_id, url, mime_type, size, width, height, duration)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [messageId, a.url, a.mime_type.toLowerCase(), Math.round(a.size), a.width ?? null, a.height ?? null, a.duration ?? null]
        );
      }

      await client.query(
        `UPDATE conversations SET updated_at = NOW(), last_message_at = NOW() WHERE id = $1`,
        [conversationId]
      );

      // A newly active thread should resurface from the archive.
      await client.query(
        `UPDATE conversation_participants SET archived_at = NULL
         WHERE conversation_id = $1 AND archived_at IS NOT NULL`,
        [conversationId]
      );

      const mod = moderation ?? detectOffPlatform(safeBody);
      if (mod.flagged) {
        for (const kind of mod.kinds) {
          await client.query(
            `INSERT INTO chat_moderation_events (message_id, conversation_id, user_id, kind, excerpt)
             VALUES ($1, $2, $3, $4, $5)`,
            [messageId, conversationId, senderId, kind, mod.excerpt]
          );
        }
      }

      await client.query('COMMIT');
      return this.getMessageById(conversationId, messageId);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  /** Own message, not system, not deleted, within 15 minutes. Audited. */
  async editMessage(
    conversationId: string,
    messageId: number,
    userId: number,
    body: string
  ): Promise<Message> {
    const trimmed = String(body ?? '').trim();
    if (!trimmed) throw new Error('EMPTY_MESSAGE');
    if (trimmed.length > CHAT_LIMITS.MAX_BODY) throw new Error('BODY_TOO_LONG');

    const db = getDB();
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const res = await client.query(
        `SELECT id, sender_id, type, body, created_at, deleted_at
         FROM messages WHERE id = $1 AND conversation_id = $2 FOR UPDATE`,
        [messageId, conversationId]
      );
      const row = res.rows[0];
      if (!row) throw new Error('MESSAGE_NOT_FOUND');
      if (Number(row.sender_id) !== Number(userId)) throw new Error('FORBIDDEN');
      if (row.type === 'system') throw new Error('SYSTEM_MESSAGE_IMMUTABLE');
      if (row.deleted_at) throw new Error('MESSAGE_DELETED');

      // Server clock is authoritative - a skewed device clock cannot extend it.
      const age = Date.now() - new Date(row.created_at).getTime();
      if (age > CHAT_LIMITS.EDIT_WINDOW_MS) throw new Error('EDIT_WINDOW_CLOSED');

      await client.query(
        `INSERT INTO message_edit_history (message_id, edited_by, previous_body, new_body)
         VALUES ($1, $2, $3, $4)`,
        [messageId, userId, row.body, trimmed]
      );

      await client.query(
        `UPDATE messages SET body = $2, edited_at = NOW() WHERE id = $1`,
        [messageId, trimmed]
      );

      await client.query('COMMIT');
      const updated = await this.getMessageById(conversationId, messageId);
      if (!updated) throw new Error('MESSAGE_NOT_FOUND');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Soft delete. The row survives so ordering, replies and the audit trail stay
   * intact; MESSAGE_SELECT blanks the content so it renders as a tombstone.
   */
  async deleteMessage(conversationId: string, messageId: number, userId: number): Promise<Message> {
    const db = getDB();
    const res = await db.query(
      `UPDATE messages SET deleted_at = NOW()
       WHERE id = $1 AND conversation_id = $2 AND sender_id = $3
         AND deleted_at IS NULL AND type <> 'system'
       RETURNING id`,
      [messageId, conversationId, userId]
    );
    if (res.rows.length === 0) {
      const exists = await db.query(
        `SELECT sender_id, deleted_at, type FROM messages WHERE id = $1 AND conversation_id = $2`,
        [messageId, conversationId]
      );
      if (exists.rows.length === 0) throw new Error('MESSAGE_NOT_FOUND');
      if (exists.rows[0].type === 'system') throw new Error('SYSTEM_MESSAGE_IMMUTABLE');
      if (Number(exists.rows[0].sender_id) !== Number(userId)) throw new Error('FORBIDDEN');
      throw new Error('MESSAGE_DELETED');
    }
    const updated = await this.getMessageById(conversationId, messageId);
    if (!updated) throw new Error('MESSAGE_NOT_FOUND');
    return updated;
  },

  // =========================================================================
  // Receipts
  // =========================================================================
  async markAsRead(conversationId: string, userId: number, seq: number): Promise<number> {
    const db = getDB();
    const res = await db.query(
      `UPDATE conversation_participants
       SET last_read_seq = GREATEST(last_read_seq, $3::bigint),
           delivered_seq = GREATEST(delivered_seq, $3::bigint)
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
       RETURNING last_read_seq`,
      [conversationId, userId, seq]
    );
    return Number(res.rows[0]?.last_read_seq ?? seq);
  },

  async markAsDelivered(conversationId: string, userId: number, seq: number): Promise<number> {
    const db = getDB();
    const res = await db.query(
      `UPDATE conversation_participants
       SET delivered_seq = GREATEST(delivered_seq, $3::bigint)
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
       RETURNING delivered_seq`,
      [conversationId, userId, seq]
    );
    return Number(res.rows[0]?.delivered_seq ?? seq);
  },

  /** Deliver everything outstanding across all of a user's threads on connect. */
  async markAllDelivered(userId: number): Promise<Array<{ conversation_id: string; seq: number }>> {
    const db = getDB();
    const res = await db.query(
      `UPDATE conversation_participants cp
       SET delivered_seq = GREATEST(cp.delivered_seq, s.seq)
       FROM (
         SELECT conversation_id, COALESCE(MAX(conversation_seq), 0) AS seq
         FROM messages GROUP BY conversation_id
       ) s
       WHERE s.conversation_id = cp.conversation_id AND cp.user_id = $1 AND cp.left_at IS NULL
       RETURNING cp.conversation_id, cp.delivered_seq AS seq`,
      [userId]
    );
    return res.rows.map((r: any) => ({ conversation_id: r.conversation_id, seq: Number(r.seq) }));
  },
};
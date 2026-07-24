import { getDB } from '../../../lib/db.js';
import type { Message, MessageAttachment } from '../types/chat.js';

export const ChatModel = {
  // Validate if a user is part of a conversation
  async isParticipant(conversationId: string, userId: number): Promise<boolean> {
    const db = getDB();
    const res = await db.query(
      `SELECT 1 FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );
    return res.rows.length > 0;
  },

  // Fetch conversations for a user
  async getUserConversations(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT 
        c.id, c.type, c.created_at, c.updated_at, c.last_message_at,
        ctx.listing_id, ctx.booking_id, ctx.type as context_type,
        cp.role, cp.last_read_message_id, cp.delivered_message_id,
        u_other.first_name as participant_first_name, 
        u_other.last_name as participant_last_name,
        l.title as listing_title,
        (SELECT la.url FROM listing_assets la WHERE la.listing_id = l.id AND la.is_primary = true LIMIT 1) as listing_image,
        (SELECT json_build_object(
          'id', m.id, 'seq', m.conversation_seq, 'body', m.body, 
          'type', m.type, 'created_at', m.created_at, 'sender_id', m.sender_id
        ) FROM messages m WHERE m.conversation_id = c.id ORDER BY m.conversation_seq DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
         AND m.conversation_seq > COALESCE(cp.last_read_message_id, 0)
         AND m.sender_id != $1) as unread_count
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       LEFT JOIN conversation_context ctx ON ctx.conversation_id = c.id
       LEFT JOIN listings l ON l.id = ctx.listing_id
       LEFT JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != $1
       LEFT JOIN users u_other ON u_other.id = cp_other.user_id
       WHERE cp.user_id = $1 AND cp.left_at IS NULL
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [userId]
    );
    return res.rows;
  },

  // Idempotent Find or Create Conversation
  async findOrCreateDirectConversation(userId: number, vendorId: number, type: string, contextId?: string): Promise<string> {
    const db = getDB();
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Check if conversation already exists for this context
      let convId: string = "";
      
      if (contextId) {
        const contextCol = type === 'listing' ? 'listing_id' : 'booking_id';
        const existing = await client.query(
          `SELECT c.id FROM conversations c
           JOIN conversation_context ctx ON ctx.conversation_id = c.id
           WHERE ctx.${contextCol} = $1 AND c.type = $2`,
          [contextId, type]
        );
        if (existing.rows.length > 0) {
          convId = existing.rows[0].id;
        }
      }

      if (!convId) {
        // Create conversation
        const convRes = await client.query(
          `INSERT INTO conversations (type) VALUES ('direct') RETURNING id`,
          []
        );
        convId = convRes.rows[0].id;

        // Add participants (Guest and Host)
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ($1, $2, 'guest'), ($1, $3, 'host')`,
          [convId, userId, vendorId]
        );

        // Add context
        if (contextId) {
          const contextCol = type === 'listing' ? 'listing_id' : 'booking_id';
          await client.query(
            `INSERT INTO conversation_context (conversation_id, ${contextCol}, type) VALUES ($1, $2, $3)`,
            [convId, contextId, type]
          );
        }
      }

      await client.query('COMMIT');
      return convId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 3. Create System Message for Booking (Triggered after markAsPaid)
  async createBookingSystemMessage(bookingId: string, userId: number, vendorId: number, listingImage: string | null, listingTitle: string): Promise<void> {
    // Find or create the booking conversation
    const conversationId = await this.findOrCreateDirectConversation(userId, vendorId, 'booking', bookingId);
    
    const body = `Booking Confirmed! Your reservation for ${listingTitle} is secured. You can now coordinate details with the vendor.`;
    
    // Use createMessage with type 'system' and an attachment
    await this.createMessage(
      conversationId,
      userId, // Sender is the system (acting as user)
      `system-${bookingId}-${Date.now()}`, // Unique idempotency key
      'system',
      body,
      listingImage ? [{ url: listingImage, mime_type: 'image/jpeg', size: 0, width: 400, height: 300 }] : []
    );
  },


  // Fetch messages with cursor pagination (before or after a specific sequence)
  async getMessages(conversationId: string, cursor?: string, direction: 'before' | 'after' = 'before', limit: number = 50): Promise<Message[]> {
    const db = getDB();
    let query = `
      SELECT m.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id, 'url', a.url, 'mime_type', a.mime_type, 
              'size', a.size, 'width', a.width, 'height', a.height, 'duration', a.duration
            )
          ) FILTER (WHERE a.id IS NOT NULL), '[]'
        ) as attachments
      FROM messages m
      LEFT JOIN message_attachments a ON a.message_id = m.id
      WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
    `;
    
    const params: any[] = [conversationId];

    if (cursor) {
      if (direction === 'before') {
        query += ` AND m.conversation_seq < $2`;
      } else {
        query += ` AND m.conversation_seq > $2`;
      }
      params.push(parseInt(cursor, 10));
    }

    query += ` GROUP BY m.id ORDER BY m.conversation_seq ${direction === 'before' ? 'DESC' : 'ASC'} LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await db.query(query, params);
    
    // If 'before', we fetched descending, so reverse to ascending for chat UI
    if (direction === 'before') {
      return res.rows.reverse();
    }
    return res.rows;
  },

  async getMessageById(conversationId: string, messageId: number): Promise<Message | null> {
    const db = getDB();

    const res = await db.query(
      `SELECT m.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'url', a.url,
              'mime_type', a.mime_type,
              'size', a.size,
              'width', a.width,
              'height', a.height,
              'duration', a.duration
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) as attachments
      FROM messages m
      LEFT JOIN message_attachments a ON a.message_id = m.id
      WHERE m.conversation_id = $1
        AND m.id = $2
        AND m.deleted_at IS NULL
      GROUP BY m.id`,
      [conversationId, messageId]
    );

    return res.rows[0] || null;
  },

  // Insert a message with idempotency and sequence generation
  async createMessage(
    conversationId: string, 
    senderId: number, 
    clientId: string, 
    type: string, 
    body: string | null,
    attachments?: Array<Omit<MessageAttachment, 'id' | 'message_id'>>
  ): Promise<Message | null> {
    const db = getDB();
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Generate sequence using our atomic function
      const seqRes = await client.query('SELECT get_next_conversation_seq($1) as seq', [conversationId]);
      const conversationSeq = seqRes.rows[0].seq;

      // 2. Insert message with ON CONFLICT for idempotency
      const msgRes = await client.query<Message>(
        `INSERT INTO messages (conversation_id, sender_id, conversation_seq, client_id, type, body)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (client_id, sender_id) DO NOTHING
         RETURNING *`,
        [conversationId, senderId, conversationSeq, clientId, type, body]
      );

      // If null, it means a conflict occurred (duplicate request). Return existing message.
      if (msgRes.rows.length === 0) {
        await client.query('ROLLBACK');
        const existing = await client.query('SELECT * FROM messages WHERE client_id = $1 AND sender_id = $2', [clientId, senderId]);
        return existing.rows[0] || null;
      }

      const message = msgRes.rows[0];

      // 3. Insert attachments if any
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          await client.query(
            `INSERT INTO message_attachments (message_id, url, mime_type, size, width, height, duration)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [message.id, att.url, att.mime_type, att.size, att.width || null, att.height || null, att.duration || null]
          );
        }
      }

      // 4. Update conversation timestamps
      await client.query(
        `UPDATE conversations SET updated_at = NOW(), last_message_at = NOW() WHERE id = $1`,
        [conversationId]
      );

      await client.query('COMMIT');
      
      // Fetch full message with attachments to return
      const fullMsg = await db.query(
        `SELECT m.*, 
          COALESCE(json_agg(json_build_object('id', a.id, 'url', a.url, 'mime_type', a.mime_type, 'size', a.size, 'width', a.width, 'height', a.height, 'duration', a.duration)) FILTER (WHERE a.id IS NOT NULL), '[]') as attachments
         FROM messages m
         LEFT JOIN message_attachments a ON a.message_id = m.id
         WHERE m.id = $1
         GROUP BY m.id`,
        [message.id]
      );

      return fullMsg.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findOrCreateSupportConversation(userId: number): Promise<string> {
    const db = getDB();
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT c.id
        FROM conversations c
        JOIN conversation_context ctx ON ctx.conversation_id = c.id
        JOIN conversation_participants cp ON cp.conversation_id = c.id
        WHERE c.type = 'support'
          AND ctx.type = 'support'
          AND cp.user_id = $1
          AND cp.left_at IS NULL
        LIMIT 1`,
        [userId]
      );

      if (existing.rows.length) {
        await client.query("COMMIT");
        return existing.rows[0].id;
      }

      const convRes = await client.query(
        `INSERT INTO conversations (type, last_message_at)
        VALUES ('support', NOW())
        RETURNING id`
      );

      const conversationId = convRes.rows[0].id;

      await client.query(
        `INSERT INTO conversation_context (conversation_id, type)
        VALUES ($1, 'support')`,
        [conversationId]
      );

      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES ($1, $2, 'guest')`,
        [conversationId, userId]
      );

      await client.query("COMMIT");
      return conversationId;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // Mark messages as read up to a specific sequence
  async markAsRead(conversationId: string, userId: number, messageSeq: number): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE conversation_participants 
       SET last_read_message_id = GREATEST(COALESCE(last_read_message_id, 0), $3)
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, messageSeq]
    );
  },

  // Mark messages as delivered up to a specific sequence
  async markAsDelivered(conversationId: string, userId: number, messageSeq: number): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE conversation_participants 
       SET delivered_message_id = GREATEST(COALESCE(delivered_message_id, 0), $3)
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, messageSeq]
    );
  }
};
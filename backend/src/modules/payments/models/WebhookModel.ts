// Handles the durable storage and polling of raw webhook events.
import { getDB } from '../../../lib/db.js';
import type { WebhookEvent } from '../types/payment.js';

export const WebhookModel = {
  /**
   * Durably stores a verified raw webhook payload.
   * Returns true if inserted, false if a duplicate was ignored.
   */
  async insertEvent(eventType: string, paystackEventId: string | undefined, payload: any): Promise<boolean> {
    const db = getDB();
    try {
      await db.query(
        `INSERT INTO webhook_events (event_type, paystack_event_id, signature_verified, raw_payload)
         VALUES ($1, $2, true, $3)
         ON CONFLICT (provider, paystack_event_id) DO NOTHING`,
        [eventType, paystackEventId, JSON.stringify(payload)]
      );
      return true;
    } catch (error) {
      console.error('Failed to insert webhook event:', error);
      return false;
    }
  },

  /**
   * Fetches a batch of unprocessed webhook events for the async processor.
   */
  async fetchUnprocessedEvents(limit: number = 20): Promise<WebhookEvent[]> {
    const db = getDB();
    const result = await db.query<WebhookEvent>(
      `SELECT * FROM webhook_events
       WHERE status = 'received'
       ORDER BY received_at
       FOR UPDATE SKIP LOCKED
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async markProcessed(id: string): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE webhook_events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
      [id]
    );
  },

  async markFailed(id: string, error: string): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE webhook_events SET status = 'failed', processing_error = $2 WHERE id = $1`,
      [id, error]
    );
  }
};
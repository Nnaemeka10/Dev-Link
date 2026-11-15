// Durable storage + atomic claiming of raw webhook events.
import { getDB } from '../../../lib/db.js';
import type { WebhookEvent } from '../types/payment.js';

/** Events stuck in 'processing' longer than this are presumed dead and requeued. */
const STALE_CLAIM_MINUTES = 10;
/** After this many attempts an event is parked as 'failed' for manual review. */
const MAX_ATTEMPTS = 5;

export const WebhookModel = {
  /**
   * Durably stores a verified raw webhook payload.
   * Returns true if inserted, false if a duplicate was ignored.
   */
  async insertEvent(eventType: string, paystackEventId: string | undefined, payload: any): Promise<boolean> {
    const db = getDB();
    try {
      const res = await db.query(
        `INSERT INTO webhook_events (event_type, paystack_event_id, signature_verified, raw_payload)
         VALUES ($1, $2, true, $3)
         ON CONFLICT (provider, paystack_event_id) DO NOTHING`,
        [eventType, paystackEventId, JSON.stringify(payload)]
      );
      return (res.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Failed to insert webhook event:', error);
      return false;
    }
  },

  /**
   * Atomically CLAIMS a batch by flipping status to 'processing' in the same
   * statement that selects them.
   *
   * The previous version ran SELECT … FOR UPDATE SKIP LOCKED through the pool
   * with no enclosing transaction, so the row locks were released the instant
   * the statement finished - overlapping 5s ticks (and multiple instances)
   * could fetch the same event twice. UPDATE … RETURNING over a SKIP LOCKED
   * subselect makes the claim durable and exclusive.
   */
  async claimEvents(limit: number = 20): Promise<WebhookEvent[]> {
    const db = getDB();
    const result = await db.query<WebhookEvent>(
      `UPDATE webhook_events
       SET status = 'processing', claimed_at = NOW()
       WHERE id IN (
           SELECT id FROM webhook_events
           WHERE status = 'received'
           ORDER BY received_at
           FOR UPDATE SKIP LOCKED
           LIMIT $1
       )
       RETURNING *`,
      [limit]
    );
    return result.rows;
  },

  /**
   * Requeues events whose worker died mid-processing. Safe because every
   * handler is idempotent (deterministic ledger keys + status guards).
   */
  async requeueStaleClaims(): Promise<number> {
    const db = getDB();
    const res = await db.query(
      `UPDATE webhook_events
       SET status = 'received', claimed_at = NULL
       WHERE status = 'processing'
         AND claimed_at < NOW() - ($1 || ' minutes')::interval`,
      [String(STALE_CLAIM_MINUTES)]
    );
    return res.rowCount ?? 0;
  },

  async markProcessed(id: string): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE webhook_events
       SET status = 'processed', processed_at = NOW(), processing_error = NULL
       WHERE id = $1`,
      [id]
    );
  },

  /**
   * Transient failures return to 'received' with exponential backoff so the
   * next sweep retries them. Only after MAX_ATTEMPTS is the event parked as
   * 'failed' - a network blip must not permanently lose a payment event.
   */
  async markFailed(id: string, error: string): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE webhook_events
       SET retry_count = retry_count + 1,
           claimed_at = NULL,
           processing_error = $2,
           status = CASE WHEN retry_count + 1 >= $3 THEN 'failed' ELSE 'received' END,
           received_at = CASE
               WHEN retry_count + 1 >= $3 THEN received_at
               ELSE NOW() + (LEAST(POWER(2, retry_count + 1), 60) || ' seconds')::interval
           END
       WHERE id = $1`,
      [id, error.slice(0, 2000), MAX_ATTEMPTS]
    );
  },
};
// Runs via cron. It safely locks due bookings, persists the payout
//  intent before calling Paystack, and handles ambiguous network failures safely.
import { getDB } from '../../../lib/db.js';
import { initiateTransfer } from '../utils/paystack.js';

/**
 * Processes due escrow payouts. 
 * Uses FOR UPDATE SKIP LOCKED for safe concurrency if scaled to multiple instances.
 */
export async function processAutomatedEscrowPayouts() {
  const db = getDB();
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Find bookings ready for payout
    const { rows: due } = await client.query(`
      SELECT 
        b.id AS booking_id, b.total_amount, b.platform_fee, 
        (b.total_amount - b.platform_fee) AS host_payout_amount,
        v.id AS vendor_id, v.paystack_recipient_code
      FROM bookings b
      JOIN vendors v ON b.vendor_id = v.id
      WHERE b.status = 'funds_held'
        AND b.payout_hold = FALSE
        AND b.dispute_window_closes_at <= NOW()
        AND NOT EXISTS (SELECT 1 FROM disputes d WHERE d.booking_id = b.id AND d.status = 'open')
      FOR UPDATE OF b SKIP LOCKED
      LIMIT 50
    `);

    // 2. Persist intent BEFORE dispatching to Paystack
    for (const payout of due) {
      const amountKobo = Math.round(parseFloat(payout.host_payout_amount) * 100);
      const dispatchReference = `payout_${payout.booking_id}_${Date.now()}`;

      await client.query(
        `INSERT INTO payout_attempts (booking_id, dispatch_reference, amount_kobo, recipient_code, status)
         VALUES ($1, $2, $3, $4, 'created')`,
        [payout.booking_id, dispatchReference, amountKobo, payout.paystack_recipient_code]
      );

      await client.query(
        `UPDATE bookings SET status = 'processing_payout', updated_at = NOW() WHERE id = $1`,
        [payout.booking_id]
      );
    }

    await client.query('COMMIT');

    // 3. Dispatch network calls OUTSIDE the DB transaction
    for (const payout of due) {
      await dispatchSinglePayout(payout);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payout worker batch failed:', error);
  } finally {
    client.release();
  }
}

async function dispatchSinglePayout(payout: any) {
  const db = getDB();
  const attemptRes = await db.query(
    `SELECT * FROM payout_attempts WHERE booking_id = $1 AND status = 'created' ORDER BY created_at DESC LIMIT 1`,
    [payout.booking_id]
  );
  if (attemptRes.rows.length === 0) return;

  const attempt = attemptRes.rows[0];
  const amountKobo = Math.round(parseFloat(payout.host_payout_amount) * 100);

  try {
    const response = await initiateTransfer(
      amountKobo,
      attempt.recipient_code,
      attempt.dispatch_reference,
      `Automated settlement for booking ${payout.booking_id}`
    );

    // Paystack accepted the request, but money hasn't moved yet.
    await db.query(
      `UPDATE payout_attempts SET status = 'dispatched', paystack_transfer_code = $2, updated_at = NOW() WHERE id = $1`,
      [attempt.id, response.data.transfer_code]
    );

  } catch (error: any) {
    // FIX Issue #1: Ambiguous failure handling
    // A timeout or 5xx does NOT mean the transfer didn't happen. 
    // Mark 'unknown' and let reconciliation resolve it. NEVER auto-retry.
    const isAmbiguous = error.code === 'ETIMEDOUT' || (error.status >= 500 && error.status <= 599);
    
    await db.query(
      `UPDATE payout_attempts SET status = $2, updated_at = NOW() WHERE id = $1`,
      [attempt.id, isAmbiguous ? 'unknown' : 'failed']
    );

    if (!isAmbiguous) {
      // Definite failure (e.g. 400 Bad Request). Revert booking so next run can retry.
      await db.query(
        `UPDATE bookings SET status = 'funds_held', updated_at = NOW() WHERE id = $1`,
        [payout.booking_id]
      );
    }
  }
}
// The self-healing mechanism. Resolves stuck 'created' attempts, 
// verifies 'unknown'/'dispatched' attempts, and checks for system-wide ledger drift.
import { getDB } from '../../../lib/db.js';
import { verifyTransfer } from '../utils/paystack.js';
import { LedgerModel } from '../models/LedgerModel.js';
import { randomUUID } from 'crypto';

export async function runReconciliation() {
  const db = getDB();

  // 1. FIX Issue #1: Sweep for stuck 'created' attempts (crash before dispatch)
  const stuckCreated = await db.query(`
    SELECT pa.*, l.vendor_id 
    FROM payout_attempts pa
    JOIN bookings b ON pa.booking_id = b.id
    JOIN listings l ON b.listing_id = l.id
    WHERE pa.status = 'created' AND pa.created_at < NOW() - INTERVAL '5 minutes'
  `);

  for (const attempt of stuckCreated.rows) {
    // Safe to revert to funds_held because no transfer was ever sent to Paystack.
    await db.query(`UPDATE payout_attempts SET status = 'failed' WHERE id = $1`, [attempt.id]);
    await db.query(`UPDATE bookings SET status = 'funds_held', updated_at = NOW() WHERE id = $1`, [attempt.booking_id]);
  }

  // 2. Resolve 'unknown' and long-pending 'dispatched' attempts
  const stuck = await db.query(`
    SELECT * FROM payout_attempts
    WHERE status IN ('unknown', 'dispatched') AND updated_at < NOW() - INTERVAL '10 minutes'
  `);

  for (const attempt of stuck.rows) {
    try {
      const verified = await verifyTransfer(attempt.dispatch_reference);
      
      if (verified.data.status === 'success') {
        await applyConfirmedPayout(attempt);
      } else if (verified.data.status === 'failed' || verified.data.status === 'reversed') {
        await db.query(`UPDATE payout_attempts SET status = 'failed' WHERE id = $1`, [attempt.id]);
        await db.query(`UPDATE bookings SET status = 'funds_held', updated_at = NOW() WHERE id = $1`, [attempt.booking_id]);
      }
    } catch (error) {
      console.error(`Reconciliation verify failed for ${attempt.dispatch_reference}`, error);
    }
  }

  // 3. System-wide ledger integrity check
  const driftRes = await db.query(`
    SELECT SUM(CASE WHEN entry_type='credit' THEN amount_kobo ELSE -amount_kobo END) AS drift
    FROM ledger_entries
  `);
  
  const drift = Number(driftRes.rows[0].drift);
  if (drift !== 0) {
    // CRITICAL ALERT: Mathematically impossible in a balanced system.
    console.error(`LEDGER DRIFT DETECTED: System is out of balance by ${drift} kobo!`);
    // In production: alertOnCall('LEDGER DRIFT', drift);
  }
}

/**
 * Applies the final double-entry ledger updates for a successful vendor payout.
 */
export async function applyConfirmedPayout(attempt: any, existingClient?: any) {
  const db = getDB();
  const client = existingClient ?? await db.connect();
  const shouldRelease = !existingClient;
  
  try {
    if (!existingClient) await client.query('BEGIN');
    // await client.query('BEGIN');

    // Lock the booking
    const bookingRes = await client.query(
      `SELECT b.total_amount, b.platform_fee, l.vendor_id 
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      WHERE b.id = $1 
      FOR UPDATE of b`,
      [attempt.booking_id]
    );
    const booking = bookingRes.rows[0];

    // Idempotency check: if booking is already released, skip.
    if (booking.status === 'payout_released') {
      await client.query('COMMIT');
      return;
    }

    const totalKobo = Math.round(parseFloat(booking.total_amount) * 100);
    const feeKobo = Math.round(parseFloat(booking.platform_fee) * 100);
    const netPayoutKobo = totalKobo - feeKobo;

    // Fetch ledger accounts
    const escrowAccount = await LedgerModel.getOrCreateAccount(client, 'escrow_holding', booking.id);
    const vendorAccount = await LedgerModel.getOrCreateAccount(client, 'vendor_payable', booking.id, booking.vendor_id);
    const platformAccount = await LedgerModel.getOrCreateAccount(client, 'platform_revenue');

    // FIX Issue #2: Use a dedicated idempotency key for the entire transaction group.
    // If the webhook is replayed, the unique index on (idempotency_key, account_id) will reject the duplicate.
    const idempotencyKey = attempt.paystack_transfer_code || attempt.dispatch_reference;

    await LedgerModel.postBalancedEntry(client, idempotencyKey, [
      { account: escrowAccount, entryType: 'debit', amountKobo: totalKobo, description: `Escrow released for payout ${attempt.booking_id}` },
      { account: vendorAccount, entryType: 'credit', amountKobo: netPayoutKobo, description: `Vendor payout confirmed ${attempt.booking_id}` },
      { account: platformAccount, entryType: 'credit', amountKobo: feeKobo, description: `Platform fee earned ${attempt.booking_id}` }
    ]);

    // Update statuses
    await client.query(`UPDATE payout_attempts SET status = 'succeeded', updated_at = NOW() WHERE id = $1`, [attempt.id]);
    await client.query(`UPDATE bookings SET status = 'payout_released', updated_at = NOW() WHERE id = $1`, [attempt.booking_id]);

    if (!existingClient) await client.query('COMMIT');

    console.log(`Payout confirmed for booking ${attempt.booking_id}. Ledger entries posted.`);
    
  } catch (error) {
    if (!existingClient) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (shouldRelease) client.release();
  }
}
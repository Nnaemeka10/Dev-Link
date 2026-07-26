// The core async processing loop. It polls the webhook_events table and applies business
//  logic (ledger updates, status changes) transactionally. This ensures a slow database 
// write never causes Paystack to retry a webhook into a half-applied state.
import { getDB } from '../../../lib/db.js';
import { WebhookModel } from '../models/WebhookModel.js';
import { LedgerModel } from '../models/LedgerModel.js';
import { randomUUID } from 'crypto';
import { runReconciliation, applyConfirmedPayout } from './reconciliation.js'

/**
 * Polls for unprocessed webhooks and applies them transactionally.
 * Designed to be run on an interval (e.g., every 5 seconds).
 */
export async function processWebhookEvents() {
  const db = getDB();
  const events = await WebhookModel.fetchUnprocessedEvents(20);

  for (const event of events) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const payload = typeof event.raw_payload === 'string' ? JSON.parse(event.raw_payload) : event.raw_payload;

      switch (event.event_type) {
        case 'charge.success':
          await handleChargeSuccess(client, payload);
          break;
        case 'transfer.success':
          await handleTransferSuccess(client, payload, event.id);
          break;
        // transfer.failed, etc. will be handled here
        default:
          // Unhandled event types are safely marked as processed
          break;
      }

      await client.query(
        `UPDATE webhook_events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
        [event.id]
      );
      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error(`Failed to process webhook ${event.id}:`, error);
      await WebhookModel.markFailed(event.id, String(error));
    } finally {
      client.release();
    }
  }
}

/**
 * Handles a successful DVA inflow (Guest payment).
 * Implements over/underpayment detection and strict double-entry ledger updates.
 */
async function handleChargeSuccess(client: any, payload: any) {
  const { reference, amount } = payload.data;
  const dvaAccountNumber = payload.data.dedicated_account?.account_number;

  if (!dvaAccountNumber) {
    throw new Error('charge.success missing dedicated_account.account_number');
  }

  // 1. Find the booking associated with this DVA
  const { rows } = await client.query(
    `SELECT id, total_amount, platform_fee, status, vendor_id FROM bookings WHERE dva_account_number = $1 FOR UPDATE`,
    [dvaAccountNumber]
  );

  if (rows.length === 0) {
    throw new Error(`Orphaned inflow: No booking found for DVA ${dvaAccountNumber}`);
  }

  const booking = rows[0];
  if (booking.status !== 'pending_payment') {
    // Idempotent no-op if already processed or not in funding state
    return; 
  }

  const totalAmountKobo = Math.round(parseFloat(booking.total_amount) * 100);
  const receivedAmountKobo = amount; // Paystack sends amount in kobo

  // 2. Determine new status based on received amount
  let newStatus = 'funds_held';
  if (receivedAmountKobo < totalAmountKobo) {
    // Underpayment: hold in pending_payment, flag for guest top-up or admin refund
    newStatus = 'pending_payment';
  }

  // 3. Update booking with received amount and new status
  await client.query(
    `UPDATE bookings 
     SET received_amount = $2, status = $3, updated_at = NOW() 
     WHERE id = $1`,
    [booking.id, (receivedAmountKobo / 100).toFixed(2), newStatus]
  );

  // 4. Post Ledger Entries ONLY if funds are successfully held
  // Overpayments are held in escrow; reconciliation/admin decides on refunding the difference.
  if (newStatus === 'funds_held') {
    const escrowAccount = await LedgerModel.getOrCreateAccount(client, 'escrow_holding', booking.id);
    const paystackWalletAccount = await LedgerModel.getOrCreateAccount(client, 'paystack_wallet');
    
    const idempotencyKey = randomUUID(); // Group ID for this inflow

    // Strict Double-Entry: Debit Paystack Wallet, Credit Escrow Holding
    await LedgerModel.postBalancedEntry(client, idempotencyKey, [
      {
        account: paystackWalletAccount,
        entryType: 'debit',
        amountKobo: receivedAmountKobo,
        description: `DVA Inflow for booking ${booking.id}`,
        paystackReference: reference,
      },
      {
        account: escrowAccount,
        entryType: 'credit',
        amountKobo: receivedAmountKobo,
        description: `Escrow funded for booking ${booking.id}`,
        paystackReference: reference,
      }
    ]);
  }
}

async function handleTransferSuccess(client: any, payload: any, eventId: any) {
  const { reference, transfer_code } = payload.data;
  
  const attemptRes = await client.query(
    `SELECT * FROM payout_attempts WHERE dispatch_reference = $1 FOR UPDATE`,
    [reference]
  );

  if (attemptRes.rows.length === 0) return;
  const attempt = attemptRes.rows[0];

  if (attempt.status === 'succeeded') return; // Idempotent no-op

  // Delegate to the shared applyConfirmedPayout logic used by reconciliation
  // We release the client lock temporarily because applyConfirmedPayout starts its own transaction
  // to ensure clean state management.
//   client.release(); // Break out of the outer transaction safely for this special delegate case
  
  // Temporarily mock the attempt object structure expected by applyConfirmedPayout
  await applyConfirmedPayout({
    id: attempt.id,
    booking_id: attempt.booking_id,
    paystack_transfer_code: transfer_code,
    dispatch_reference: reference
  }, client); // Pass the existing client
  
//   // Re-acquire a client for the outer loop to mark the webhook processed
//   const db = getDB();
//   const newClient = await db.connect();
//   await newClient.query('BEGIN');
//   await newClient.query(
//     `UPDATE webhook_events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
//     [event.id] // Note: event is in scope from the outer loop
  await client.query(
    `UPDATE webhook_events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
    [eventId]
  );
//   await newClient.query('COMMIT');
//   newClient.release();
}
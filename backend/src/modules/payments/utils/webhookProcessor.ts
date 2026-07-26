// The core async processing loop. It polls the webhook_events table and applies business
//  logic (ledger updates, status changes) transactionally. This ensures a slow database 
// write never causes Paystack to retry a webhook into a half-applied state.
import { getDB } from '../../../lib/db.js';
import { WebhookModel } from '../models/WebhookModel.js';
import { LedgerModel } from '../models/LedgerModel.js';
import { randomUUID } from 'crypto';
import { applyConfirmedPayout } from './reconciliation.js'

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
      console.log(`Processed webhook ${event.id} of type ${event.event_type}`);
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
    `SELECT id, total_amount, platform_fee, status, vendor_id 
     FROM bookings 
     WHERE payment_reference = $1 OR dva_account_number = $2  
     FOR UPDATE`,
    [reference, dvaAccountNumber || null]
  );

  if (rows.length === 0) {
    throw new Error(`Orphaned inflow: No booking found for reference ${reference} or DVA ${dvaAccountNumber}`);
  }

  const booking = rows[0];

  // Idempotency check: Only process if pending
  if (booking.status !== 'pending' && booking.status !== 'pending_payment') {
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

    // 5. Create the system chat message now that funds are secured
    const bookingDetails = await client.query(
      `SELECT b.id, b.user_id, l.vendor_id, l.title as listing_title,
       (SELECT la.url FROM listing_assets la WHERE la.listing_id = l.id AND la.is_primary = true LIMIT 1) as listing_image
       FROM bookings b JOIN listings l ON b.listing_id = l.id WHERE b.id = $1`,
      [booking.id]
    );

    if (bookingDetails.rows.length > 0) {
      const d = bookingDetails.rows[0];
      const { ChatModel } = await import('../../chat/models/Chat.js');
      await ChatModel.createBookingSystemMessage(d.id, d.user_id, d.vendor_id, d.listing_image, d.listing_title);
    }
  }
}

//Handles a successful vendor payout (Transfer).
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
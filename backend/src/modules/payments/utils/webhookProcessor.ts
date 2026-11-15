// The core async processing loop. It polls the webhook_events table and applies
// business logic transactionally, so a slow DB write never leaves Paystack
// retrying into a half-applied state.
import { getDB } from '../../../lib/db.js';
import { WebhookModel } from '../models/WebhookModel.js';
import { applyConfirmedPayout, PayoutNotification } from './reconciliation.js';
import { BookingModel } from '../../bookings/models/Booking.js';
import { RefundModel } from '../models/RefundModel.js';
import type { PoolClient } from 'pg';
import { bookingEmailService } from '../../../emails/bookingEmails.js';

/**
 * Polls for unprocessed webhooks and applies them transactionally.
 * Designed to be run on an interval (e.g., every 5 seconds).
 */
export async function processWebhookEvents() {
  const requeued = await WebhookModel.requeueStaleClaims();
  if (requeued > 0) console.log(`[webhook] requeued ${requeued} stale claim(s)`);

  const events = await WebhookModel.claimEvents(20);
  const db = getDB();

  for (const event of events) {
    const client = await db.connect();
    let payoutEmail: PayoutNotification | null = null;
    try {
      await client.query('BEGIN');
      const payload = typeof event.raw_payload === 'string' ? JSON.parse(event.raw_payload) : event.raw_payload;

      switch (event.event_type) {
        case 'charge.success':
          await handleChargeSuccess(payload);
          break;

        case 'transfer.success':
          payoutEmail = await handleTransferSuccess(client, payload);
          break;

        case 'customeridentification.success':
          await handleIdentitySuccess(client, payload);
          break;

        case 'customeridentification.failed':
          await handleIdentityFailed(client, payload);
          break;

        case 'refund.processed':
          await RefundModel.applyRefundWebhook(
            client,
            payload.data.transaction?.reference ?? payload.data.reference,
            true
          );
          break;

        case 'refund.failed':
          await RefundModel.applyRefundWebhook(
            client,
            payload.data.transaction?.reference ?? payload.data.reference,
            false
          );
          break;

        default:
          // Unhandled event types are safely marked as processed.
          break;
      }

      await client.query(
        `UPDATE webhook_events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
        [event.id]
      );
      await client.query('COMMIT');
      if (payoutEmail) {
        try {
          await bookingEmailService.sendPayoutToVendor(
            payoutEmail.vendorEmail, payoutEmail.vendorName,
            payoutEmail.listingTitle, payoutEmail.bookingRef, payoutEmail.money
          );
        } catch (emailError) {
          console.error('[webhook] payout email failed:', emailError);
        }
      }
      console.log(`Processed webhook ${event.id} of type ${event.event_type}`);
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`Failed to process webhook ${event.id}:`, error);
      await WebhookModel.markFailed(event.id, String(error));
    } finally {
      client.release();
    }
  }
}

/**
 * Successful charge - the async, authoritative counterpart to verifyPayment.
 * Works for EVERY Paystack channel (card, bank, USSD, bank_transfer): matched
 * by transaction reference, never by a dedicated account number.
 *
 * Settlement runs in its own transaction with its own row lock and its own
 * deterministic ledger key (`charge:<reference>`), so it is safe for it to
 * commit independently of this webhook's bookkeeping transaction: if the
 * bookkeeping fails afterwards, the event is retried and settlement no-ops.
 */
async function handleChargeSuccess(payload: any) {
  const reference: string | undefined = payload?.data?.reference;
  const amountKobo: number | undefined = payload?.data?.amount;

  if (!reference) {
    throw new Error('charge.success payload missing data.reference');
  }

  const { outcome, booking } = await BookingModel.settleSuccessfulCharge(reference, amountKobo);

  if (outcome === 'amount_mismatch') {
    // Settlement already recorded the discrepancy and alerted support. Fail
    // the event so it is not retried into a false success.
    throw new Error(`AMOUNT_MISMATCH for reference ${reference}`);
  }

  if (outcome === 'already_settled') {
    console.log(`charge.success replay for ${reference} - already settled (no-op)`);
    return;
  }

  console.log(`charge.success settled booking ${booking?.id} (${reference})`);
}

/** Handles a successful vendor payout (Transfer). */
async function handleTransferSuccess(client: PoolClient, payload: any): Promise<PayoutNotification | null> {
  const { reference, transfer_code } = payload.data;

  const attemptRes = await client.query(
    `SELECT * FROM payout_attempts WHERE dispatch_reference = $1 FOR UPDATE`,
    [reference]
  );
  if (attemptRes.rows.length === 0) return null;
  const attempt = attemptRes.rows[0];
  if (attempt.status === 'succeeded') return null;

  return applyConfirmedPayout(
    {
      id: attempt.id,
      booking_id: attempt.booking_id,
      paystack_transfer_code: transfer_code,
      dispatch_reference: reference,
    },
    client
  );
}

/** Successful Government ID (BVN/NIN) verification from Paystack. */
async function handleIdentitySuccess(client: PoolClient, payload: any) {
  const customerCode = payload?.data?.customer_code;
  if (!customerCode) return;

  await client.query(
    `UPDATE vendors SET
        verification_status = 'verified',
        verification_checked_at = NOW(),
        updated_at = NOW()
     WHERE user_id = (SELECT id FROM users WHERE paystack_customer_code = $1)`,
    [customerCode]
  );
}

/** Failed Government ID verification from Paystack. */
async function handleIdentityFailed(client: PoolClient, payload: any) {
  const customerCode = payload?.data?.customer_code;
  if (!customerCode) return;

  await client.query(
    `UPDATE vendors SET
        verification_status = 'manual_review',
        verification_checked_at = NOW(),
        updated_at = NOW()
     WHERE user_id = (SELECT id FROM users WHERE paystack_customer_code = $1)`,
    [customerCode]
  );
}
import { Request, Response } from 'express';
import crypto from 'crypto';
import { BookingModel } from '../../bookings/models/Booking.js';
import { getDB } from '../../../lib/db.js';
import { createDedicatedVirtualAccount, initializePaystackTransaction, verifyPaystackTransaction } from '../utils/paystack.js';
import { ENV } from '../../../lib/env.js';
import { WebhookModel } from '../models/WebhookModel.js';

// 
// Paystack source-verification helpers (shared by the webhook
// ingestor and /transfer-approval)
// 

/**
 * Paystack's documented source IPs for server-to-server calls. Used as
 * defense-in-depth on top of the HMAC signature check.
 * Override without redeploying via the PAYSTACK_WEBHOOK_IPS env var, e.g.:
 *   PAYSTACK_WEBHOOK_IPS="52.31.139.55,52.31.139.157,52.31.10.183"
 * For local testing set it to "127.0.0.1" so your simulated Paystack calls pass.
 * Keep this list in sync with https://paystack.com/docs/payments/webhooks/
 */
const PAYSTACK_IP_ALLOWLIST = (
  ENV.PAYSTACK_WEBHOOK_IPS || '52.31.139.75,52.49.173.169,52.214.14.220'
)
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

/** Real client IP */
function getClientIp(req: Request): string {
  const ip = (req.ip || req.socket.remoteAddress || '').toString();
  // Normalize IPv6-mapped IPv4, e.g. "::ffff:52.31.139.55" - "52.31.139.55"
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function isPaystackIp(req: Request): boolean {
  return PAYSTACK_IP_ALLOWLIST.includes(getClientIp(req));
}

/**
 * Timing-safe verification of Paystack's x-paystack-signature header:
 * HMAC-SHA512 of the RAW request body, keyed with the Paystack secret key.
 * The raw body is captured in app.ts for /api/payments/webhook and
 * /api/payments/transfer-approval.
 */
function isValidPaystackSignature(req: Request): boolean {
  const secret = ENV.PAYSTACK_SECRET_KEY;
  const rawBody = (req as any).rawBody as string | undefined;

  const signatureHeader = req.headers['x-paystack-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  if (!secret || !rawBody || !signature || typeof signature !== 'string') {
    return false;
  }

  const expected = crypto.createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');

  // timingSafeEqual throws when lengths differ, so compare lengths first
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const initializePayment = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { bookingId } = req.body;
        if (!bookingId) {
            res.status(400).json({ message: 'Booking ID is required' });
            return;
        }

        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }

        // Security: Verify ownership
        if (Number(booking.user_id) !== Number(req.user.userId)) {
            res.status(403).json({ message: 'Forbidden: You do not own this booking' });
            return;
        }

        // Security: Verify status is still pending
        if (booking.status !== 'pending') {
            res.status(400).json({ message: `Booking cannot be paid (Status: ${booking.status})` });
            return;
        }

        // Safety: booking's payment window must still be open
        const expiresAt = (booking as any).expires_at;
        if (expiresAt && new Date(expiresAt) < new Date()) {
            res.status(400).json({ message: 'This booking session has expired. Please start a new booking.' });
            return;
        }

        const toDateString = (d: string | Date) => {
            const dt = new Date(d);
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        };
        const stillAvailable = await BookingModel.checkAvailability(
            booking.listing_id,
            toDateString(booking.start_date),
            toDateString(booking.end_date),
            Number(booking.user_id),
            booking.excluded_dates ?? []
        );
        if (!stillAvailable) {
            res.status(409).json({ message: 'Selected dates are no longer available' });
            return;
        }

        await BookingModel.refreshHold(booking.id);
       
        let paymentReference = booking.payment_reference;

        if (paymentReference){
           if (booking.payment_status === 'success') {
                return res.status(400).json({ message: 'Payment already processed' });
            }
            if (booking.payment_status === 'pending') {
                //do nothing, / Reuse existing reference – Paystack will return the existing access_code
        // (no DB update needed, we'll just use it below)
            } else if (booking.payment_status === 'failed') {
                // Failed payment – generate a new reference so Paystack doesn't reject it
                paymentReference = `PSK-${booking.booking_reference}-${Date.now()}`;
                await BookingModel.updatePaymentReference(booking.id, paymentReference);
            } else {
                return res.status(400).json({ message: 'Payment already processed' });
            }
        } else {
             // First attempt – generate and save a new reference
            paymentReference = `PSK-${booking.booking_reference}`;
            await BookingModel.updatePaymentReference(booking.id, paymentReference);
        }


        // Fetch user email for Paystack
        const db = getDB();
        const userRes = await db.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
        if (userRes.rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const userEmail = userRes.rows[0].email;

        // Call Paystack
        const paystackRes = await initializePaystackTransaction(
            userEmail,
            parseFloat(booking.total_amount.toString()),
            paymentReference
        );

        res.status(200).json({
            accessCode: paystackRes.data.access_code,
            reference: paystackRes.data.reference
        });

    } catch (error: any) {
        console.error('Initialize payment error:', error);
        res.status(500).json({ message: error.message || 'Failed to initialize payment' });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { reference } = req.params;
        if (!reference) {
            res.status(400).json({ message: 'Reference is required' });
            return;
        }

        // Call Paystack Verify API
        const paystackRes = await verifyPaystackTransaction(reference);
        
        if (paystackRes.data.status === 'success') {
            //Fetch booking to verify amounts match BEFORE marking paid
            const booking = await BookingModel.findByPaymentReference(reference);

            if (!booking) {
                res.status(404).json({ message: 'Booking not found for this reference' });
                return;
            }

            // Prevent partial payment exploits
            const expectedKobo = Math.round(parseFloat(booking.total_amount.toString()) * 100);
            if (paystackRes.data.amount !== expectedKobo) {
                console.error(`SECURITY: Amount mismatch! Expected ${expectedKobo}, Got ${paystackRes.data.amount}`);
                await BookingModel.markAsFailed(reference);
                return res.status(400).json({ message: 'Payment amount mismatch. Refunding will be initiated, contact support.' });
            }

            // Mark as paid in DB (Idempotent function)
            await BookingModel.markAsPaid(reference);
            
            res.status(200).json({ 
                status: 'success', 
                bookingId: booking.id,
                message: 'Payment verified successfully' 
            });
        } else {
            // Mark as failed if status is failed
            await BookingModel.markAsFailed(reference);
            res.status(400).json({ status: 'failed', message: 'Payment was not successful' });
        }

    } catch (error: any) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: error.message || 'Failed to verify payment' });
    }
};

/**
 * INGESTOR: The only endpoint Paystack talks to directly.
 * Verifies signature, durably stores the raw payload, and returns 200 instantly.
 * Business logic is handled asynchronously by the webhookProcessor.
 */
export const paystackWebhookIngestor = async (req: Request, res: Response) => {
  // 1. Verify signature securely (timing-safe HMAC over the raw body)
  if (!(req as any).rawBody) {
    console.error('paystackWebhookIngestor: rawBody missing - cannot verify signature. Check that the route path matches the express.json() verify capture in app.ts and the URL set in the Paystack dashboard.');
    return res.status(400).send('Bad request: raw body unavailable for signature verification');
  }

  if (!isValidPaystackSignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  const payload = req.body;
  const eventType = payload.event;
  const paystackEventId = payload.data?.id ?? payload.data?.reference;

  // 2. Durably persist the event
  const inserted = await WebhookModel.insertEvent(eventType, paystackEventId, payload);
  
  if (!inserted) {
    // Duplicate webhook received, safe to ack
    return res.status(200).send('Duplicate event ignored');
  }

  // 3. Acknowledge receipt immediately so Paystack doesn't retry
  return res.status(200).send('Webhook received');
};

/**
 * TRANSFER APPROVAL: Security-critical endpoint for automated payouts.
 * Paystack calls this before executing a transfer. We verify that we actually
 * initiated the payout attempt in our database.
 *
 * this endpoint previously trusted the request body alone 
 * anyone who learned or guessed a dispatch_reference could authenticate payout
 * intents and flip payout_attempts to 'awaiting_webhook'. It now requires BOTH:
 *   1. Paystack's x-paystack-signature: HMAC-SHA512 of the raw body keyed with
 *      PAYSTACK_SECRET_KEY - verified exactly like the webhook ingestor, and
 *   2. the request originating from Paystack's documented IP range
 *      (defense-in-depth; configurable via PAYSTACK_WEBHOOK_IPS).
 * The HMAC is the primary control  never remove it.
 */
export const paystackTransferApproval = async (req: Request, res: Response) => {
  // 1. Verify the Paystack HMAC signature over the RAW request body
  if (!isValidPaystackSignature(req)) {
    console.warn('[transfer-approval] Rejected: invalid or missing x-paystack-signature');
    return res.status(401).json({ status: 'failed', message: 'Invalid or missing signature' });
  }

  // 2. Defense-in-depth: only accept requests from Paystack's servers
  if (!isPaystackIp(req)) {
    console.warn(`[transfer-approval] Rejected: source IP ${getClientIp(req)} is not in the Paystack allow-list`);
    return res.status(403).json({ status: 'failed', message: 'Forbidden' });
  }

  const { reference, amount, recipient_code } = req.body;
  const db = getDB();

  try {
    const { rows } = await db.query(
      `SELECT * FROM payout_attempts WHERE dispatch_reference = $1 AND status = 'created'`,
      [reference]
    );

    const attempt = rows[0];
    
    // Authenticate the transfer intent against our records
    const authentic = attempt &&
      attempt.amount_kobo === amount &&
      attempt.recipient_code === recipient_code;

    if (authentic) {
      // Mark as awaiting webhook since Paystack accepted our intent
      await db.query(
        `UPDATE payout_attempts SET status = 'awaiting_webhook', updated_at = NOW() WHERE id = $1`,
        [attempt.id]
      );
      return res.status(200).json({ status: 'success' });
    } else {
      console.error(`TRANSFER APPROVAL FAILED: Ref ${reference}. Intent not found or mismatch.`);
      return res.status(400).json({ status: 'failed' });
    }
  } catch (error) {
    console.error('Transfer approval error:', error);
    return res.status(500).json({ status: 'error' });
  }
};

/**
 * Creates a Dedicated Virtual Account for a booking.
 * Called internally right after a booking is created.
 */
export const provisionDvaForBooking = async (bookingId: string, userId: number, userEmail: string) => {
  const db = getDB();
  
  // 1. Fetch or create Paystack Customer Code for the user
  let userRes = await db.query('SELECT paystack_customer_code FROM users WHERE id = $1', [userId]);
  let customerCode = userRes.rows[0].paystack_customer_code;

  if (!customerCode) {
    // Note: In a real production app, you'd call Paystack's /customer endpoint here.
    // For brevity, we assume the user creation flow handles this or we mock it.
    throw new Error('User missing paystack_customer_code. Please create customer first.');
  }

  // 2. Call Paystack to assign a DVA
  const dvaRes = await createDedicatedVirtualAccount(userEmail, customerCode);
  const accountNumber = dvaRes.data.account_number;
  const bankSlug = dvaRes.data.bank.slug;

  // 3. Update the booking with DVA details
  await db.query(
    `UPDATE bookings SET dva_account_number = $2, dva_bank_slug = $3 WHERE id = $1`,
    [bookingId, accountNumber, bankSlug]
  );

  return { accountNumber, bankSlug };
};
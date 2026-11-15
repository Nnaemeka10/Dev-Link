import { Request, Response } from 'express';
import crypto from 'crypto';
import { BookingModel } from '../../bookings/models/Booking.js';
import { getDB } from '../../../lib/db.js';
import { initializePaystackTransaction, verifyPaystackTransaction } from '../utils/paystack.js';
import { ENV } from '../../../lib/env.js';
import { WebhookModel } from '../models/WebhookModel.js';

//
// Paystack source-verification helpers (shared by the webhook
// ingestor and /transfer-approval)
//

const PAYSTACK_IP_ALLOWLIST = (
  ENV.PAYSTACK_WEBHOOK_IPS || '52.31.139.75,52.49.173.169,52.214.14.220'
)
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

function getClientIp(req: Request): string {
  const ip = (req.ip || req.socket.remoteAddress || '').toString();
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function isPaystackIp(req: Request): boolean {
  return PAYSTACK_IP_ALLOWLIST.includes(getClientIp(req));
}

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

        if (Number(booking.user_id) !== Number(req.user.userId)) {
            res.status(403).json({ message: 'Forbidden: You do not own this booking' });
            return;
        }

        if (booking.status !== 'pending') {
            res.status(400).json({ message: `Booking cannot be paid (Status: ${booking.status})` });
            return;
        }

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

        if (paymentReference) {
            if (booking.payment_status === 'success') {
                res.status(400).json({ message: 'Payment already processed' });
                return;
            }
            if (booking.payment_status === 'pending') {
                // Reuse existing reference - Paystack returns the existing access_code.
            } else if (booking.payment_status === 'failed') {
                paymentReference = `PSK-${booking.booking_reference}-${Date.now()}`;
                await BookingModel.updatePaymentReference(booking.id, paymentReference);
            } else {
                res.status(400).json({ message: 'Payment already processed' });
                return;
            }
        } else {
            paymentReference = `PSK-${booking.booking_reference}`;
            await BookingModel.updatePaymentReference(booking.id, paymentReference);
        }

        const db = getDB();
        const userRes = await db.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
        if (userRes.rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const userEmail = userRes.rows[0].email;

        const paystackRes = await initializePaystackTransaction(
            userEmail,
            parseFloat(booking.total_amount.toString()),
            paymentReference
        );

        res.status(200).json({
            accessCode: paystackRes.data.access_code,
            reference: paystackRes.data.reference,
        });
    } catch (error: any) {
        console.error('Initialize payment error:', error);
        res.status(500).json({ message: 'Failed to initialize payment' });
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

        const paystackRes = await verifyPaystackTransaction(reference);

        if (paystackRes.data.status !== 'success') {
            await BookingModel.markAsFailed(reference);
            res.status(400).json({ status: 'failed', message: 'Payment was not successful' });
            return;
        }

        const { outcome, booking } = await BookingModel.settleSuccessfulCharge(
            reference,
            paystackRes.data.amount
        );

        if (outcome === 'amount_mismatch') {
            res.status(400).json({
                message: 'Payment amount mismatch. Refunding will be initiated, contact support.',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            bookingId: booking!.id,
            message: 'Payment verified successfully',
        });
    } catch (error: any) {
        if (error?.message === 'BOOKING_NOT_FOUND') {
            res.status(404).json({ message: 'Booking not found for this reference' });
            return;
        }
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
};

/**
 * INGESTOR: The only endpoint Paystack talks to directly.
 * Verifies signature, durably stores the raw payload, returns 200 instantly.
 */
export const paystackWebhookIngestor = async (req: Request, res: Response) => {
  if (!(req as any).rawBody) {
    console.error('paystackWebhookIngestor: rawBody missing - cannot verify signature.');
    return res.status(400).send('Bad request: raw body unavailable for signature verification');
  }

  if (!isValidPaystackSignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  const payload = req.body;
  const eventType = payload.event;
  const paystackEventId = payload.data?.id ?? payload.data?.reference;

  const inserted = await WebhookModel.insertEvent(eventType, paystackEventId, payload);

  if (!inserted) {
    return res.status(200).send('Duplicate event ignored');
  }

  return res.status(200).send('Webhook received');
};

/**
 * TRANSFER APPROVAL: verifies we initiated the payout before Paystack executes.
 * Requires BOTH a valid HMAC signature and a Paystack source IP.
 */
export const paystackTransferApproval = async (req: Request, res: Response) => {
  if (!isValidPaystackSignature(req)) {
    console.warn('[transfer-approval] Rejected: invalid or missing x-paystack-signature');
    return res.status(401).json({ status: 'failed', message: 'Invalid or missing signature' });
  }

  if (!isPaystackIp(req)) {
    console.warn(`[transfer-approval] Rejected: source IP ${getClientIp(req)} not allow-listed`);
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
    const authentic = attempt &&
      attempt.amount_kobo === amount &&
      attempt.recipient_code === recipient_code;

    if (authentic) {
      await db.query(
        `UPDATE payout_attempts SET status = 'awaiting_webhook', updated_at = NOW() WHERE id = $1`,
        [attempt.id]
      );
      return res.status(200).json({ status: 'success' });
    }

    console.error(`TRANSFER APPROVAL FAILED: Ref ${reference}. Intent not found or mismatch.`);
    return res.status(400).json({ status: 'failed' });
  } catch (error) {
    console.error('Transfer approval error:', error);
    return res.status(500).json({ status: 'error' });
  }
};
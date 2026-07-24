import crypto from 'crypto';
import { BookingModel } from '../../bookings/models/Booking.js';
import { getDB } from '../../../lib/db.js';
import { initializePaystackTransaction, verifyPaystackTransaction } from '../utils/paystack.js';
import { ENV } from '../../../lib/env.js';
export const initializePayment = async (req, res) => {
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
        if (booking.user_id !== req.user.userId) {
            res.status(403).json({ message: 'Forbidden: You do not own this booking' });
            return;
        }
        // Security: Verify status is still pending
        if (booking.status !== 'pending') {
            res.status(400).json({ message: `Booking cannot be paid (Status: ${booking.status})` });
            return;
        }
        // Fetch user email for Paystack
        const db = getDB();
        const userRes = await db.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
        if (userRes.rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const userEmail = userRes.rows[0].email;
        // Generate unique payment reference
        const paymentReference = `PSK-${booking.booking_reference}`;
        // Update booking with payment reference
        await BookingModel.updatePaymentReference(booking.id, paymentReference);
        // Call Paystack
        const paystackRes = await initializePaystackTransaction(userEmail, parseFloat(booking.total_amount.toString()), paymentReference);
        res.status(200).json({
            accessCode: paystackRes.data.access_code,
            reference: paystackRes.data.reference
        });
    }
    catch (error) {
        console.error('Initialize payment error:', error);
        res.status(500).json({ message: error.message || 'Failed to initialize payment' });
    }
};
export const verifyPayment = async (req, res) => {
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
            // SECURITY CHECK: Prevent partial payment exploits
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
        }
        else {
            // Mark as failed if status is failed
            await BookingModel.markAsFailed(reference);
            res.status(400).json({ status: 'failed', message: 'Payment was not successful' });
        }
    }
    catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: error.message || 'Failed to verify payment' });
    }
};
export const paystackWebhook = async (req, res) => {
    try {
        // Verify Paystack Webhook Signature using the raw body
        const secret = ENV.PAYSTACK_SECRET_KEY;
        //use req.rawBody captured in app.ts for signature verification
        const rawBody = req.rawBody || JSON.stringify(req.body);
        const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
        if (hash !== req.headers['x-paystack-signature']) {
            res.status(401).send('Invalid signature');
            return;
        }
        const event = req.body;
        // Only process successful charge events
        if (event.event === 'charge.success') {
            const reference = event.data.reference;
            const expectedAmount = event.data.amount; // In kobo
            // Double verify via API to prevent spoofing (Webhook payload is NOT proof of payment)
            const verifyRes = await verifyPaystackTransaction(reference);
            if (verifyRes.data.status === 'success') {
                // Idempotent update
                const booking = await BookingModel.markAsPaid(reference);
                if (booking) {
                    // Security check: Ensure the amount paid matches the booking amount
                    const expectedKobo = Math.round(parseFloat(booking.total_amount.toString()) * 100);
                    if (verifyRes.data.amount === expectedKobo) {
                        console.log(`✅ Booking ${booking.id} successfully paid via webhook.`);
                        // TODO: Send confirmation email, notify vendor, etc.
                    }
                    else {
                        console.error(`⚠️ Amount mismatch for booking ${booking.id}. Expected: ${expectedKobo}, Got: ${verifyRes.data.amount}`);
                        await BookingModel.markAsFailed(reference);
                    }
                }
            }
        }
        // Always return 200 to Paystack immediately to acknowledge receipt
        res.status(200).send('Webhook received');
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Webhook processing failed');
    }
};
//# sourceMappingURL=payment.controller.js.map
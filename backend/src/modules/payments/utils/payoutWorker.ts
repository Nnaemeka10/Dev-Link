import { getDB } from '../../../lib/db.js';
import { initiateTransfer } from './paystack.js';
import { moneyFromBooking } from './money.js';

/**
 * Automated escrow release.
 *
 * Runs on an interval. A booking becomes payable when:
 *   • it was paid and the vendor confirmed it (or legacy funds_held / completed),
 *   • the dispute window has closed (event end + 24h),
 *   • no payout/refund hold and no open dispute,
 *   • the vendor is verified and has a Paystack recipient code,
 *   • there is no in-flight or succeeded payout attempt.
 *
 * The vendor receives vendorNet = subtotal − 10% commission. VAT and the
 * commission stay in the platform balance and are split into tax_payable /
 * platform_revenue by applyConfirmedPayout when the transfer is confirmed.
 */
export async function processAutomatedEscrowPayouts(): Promise<void> {
    const db = getDB();

    const { rows: due } = await db.query(
        `SELECT b.id
         FROM bookings b
         JOIN listings l ON l.id = b.listing_id
         JOIN vendors v ON v.user_id = l.vendor_id
         WHERE b.status IN ('confirmed', 'funds_held', 'completed')
           AND b.payment_status = 'success'
           AND b.dispute_window_closes_at <= NOW()
           AND b.payout_hold = FALSE
           AND v.verification_status = 'verified'
           AND v.paystack_recipient_code IS NOT NULL
           AND NOT EXISTS (
                SELECT 1 FROM disputes d
                WHERE d.booking_id = b.id AND d.status = 'open'
           )
           AND NOT EXISTS (
                SELECT 1 FROM payout_attempts pa
                WHERE pa.booking_id = b.id AND pa.status <> 'failed'
           )
         ORDER BY b.dispute_window_closes_at ASC
         LIMIT 20`
    );

    for (const { id } of due) {
        const client = await db.connect();
        let attempt: any = null;
        let booking: any = null;

        try {
            await client.query('BEGIN');

            const locked = await client.query(
                `SELECT b.*, l.vendor_id AS vendor_user_id,
                        v.id AS vendor_ledger_id, v.paystack_recipient_code
                 FROM bookings b
                 JOIN listings l ON l.id = b.listing_id
                 JOIN vendors v ON v.user_id = l.vendor_id
                 WHERE b.id = $1
                 FOR UPDATE OF b`,
                [id]
            );
            booking = locked.rows[0];
            if (!booking) { await client.query('ROLLBACK'); continue; }

            // Re-check guards under the row lock (a refund/dispute may have
            // landed between the sweep query and this lock).
            if (
                !['confirmed', 'funds_held', 'completed'].includes(booking.status) ||
                booking.payout_hold ||
                booking.payment_status !== 'success'
            ) {
                await client.query('ROLLBACK');
                continue;
            }

            const active = await client.query(
                `SELECT 1 FROM payout_attempts
                 WHERE booking_id = $1 AND status <> 'failed' LIMIT 1`,
                [id]
            );
            if (active.rows.length > 0) { await client.query('ROLLBACK'); continue; }

            const money = moneyFromBooking(booking);

            // Free booking: nothing to transfer. Close it out.
            if (money.vendorNetKobo <= 0) {
                await client.query(
                    `UPDATE bookings SET status = 'payout_released' WHERE id = $1`,
                    [id]
                );
                await client.query('COMMIT');
                continue;
            }

            const dispatchReference = `payout_${id}_${Date.now()}`;
            const inserted = await client.query(
                `INSERT INTO payout_attempts
                    (booking_id, dispatch_reference, amount_kobo, recipient_code, status)
                 VALUES ($1, $2, $3, $4, 'created')
                 RETURNING *`,
                [id, dispatchReference, money.vendorNetKobo, booking.paystack_recipient_code]
            );
            attempt = inserted.rows[0];
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            console.error(`[payout] Failed to prepare payout for booking ${id}:`, error);
            continue;
        } finally {
            client.release();
        }

        if (!attempt) continue;

        // Network call outside any DB transaction.
        try {
            const transfer = await initiateTransfer(
                attempt.amount_kobo,
                attempt.recipient_code,
                attempt.dispatch_reference,
                `EventVnV payout for booking ${id}`
            );

            await db.query(
                `UPDATE payout_attempts
                 SET status = 'awaiting_webhook',
                     paystack_transfer_code = $2,
                     updated_at = NOW()
                 WHERE id = $1`,
                [attempt.id, transfer.data.transfer_code]
            );
            await db.query(
                `UPDATE bookings SET status = 'processing_payout' WHERE id = $1`,
                [id]
            );
            console.log(`[payout] Dispatched ${attempt.dispatch_reference} for booking ${id}`);
        } catch (error) {
            console.error(`[payout] Transfer failed for ${attempt.dispatch_reference}:`, error);
            await db.query(
                `UPDATE payout_attempts SET status = 'failed', updated_at = NOW() WHERE id = $1`,
                [attempt.id]
            );
            // Booking stays confirmed; the next sweep may retry once the
            // failed attempt no longer blocks it.
        }
    }
}
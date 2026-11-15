import { getDB } from '../../../lib/db.js';
import type { PoolClient } from 'pg';
import { LedgerModel } from '../models/LedgerModel.js';
import { moneyFromBooking, assertSplitBalances } from './money.js';
import { verifyTransfer } from './paystack.js';
import { bookingEmailService } from '../../../emails/bookingEmails.js';

export interface PayoutNotification {
    vendorEmail: string;
    vendorName: string;
    listingTitle: string;
    bookingRef: string;
    money: { subtotal: number; commission: number; vat: number; vendorNet: number };
}

const TERMINAL_BOOKING = ['refunded', 'cancelled', 'declined', 'expired', 'failed'];

/**
 * Final double-entry split for a confirmed vendor payout. Idempotent:
 *   • payout_attempts row lock + status guard,
 *   • deterministic ledger key `payout:<bookingId>`.
 * Safe to call from the transfer webhook and from reconciliation.
 */
export async function applyConfirmedPayout(
    attemptRef: { id: string; booking_id: string; paystack_transfer_code?: string | null; dispatch_reference?: string | null },
    existingClient?: PoolClient
): Promise<PayoutNotification | null> {
    const db = getDB();
    const client = existingClient ?? await db.connect();
    const ownsTransaction = !existingClient;

    try {
        if (ownsTransaction) await client.query('BEGIN');

        const attemptRes = await client.query(
            `SELECT * FROM payout_attempts WHERE id = $1 FOR UPDATE`,
            [attemptRef.id]
        );
        const attempt = attemptRes.rows[0];
        if (!attempt) throw new Error('PAYOUT_ATTEMPT_NOT_FOUND');
        if (attempt.status === 'succeeded') {
            if (ownsTransaction) await client.query('COMMIT');
            return null;
        }

        const bookingRes = await client.query(
            `SELECT b.*, l.title AS listing_title, l.vendor_id AS vendor_user_id, 
                    v.id AS vendor_ledger_id
                    vu.email AS vendor_email, vu.first_name AS vendor_first_name
             FROM bookings b
             JOIN listings l ON l.id = b.listing_id
             JOIN vendors v ON v.user_id = l.vendor_id
             JOIN users vu ON vu.id = l.vendor_id
             WHERE b.id = $1
             FOR UPDATE OF b`,
            [attempt.booking_id]
        );
        const booking = bookingRes.rows[0];
        if (!booking) throw new Error('BOOKING_NOT_FOUND');

        if (TERMINAL_BOOKING.includes(booking.status)) {
            // Money may already have moved; never silently split escrow for a
            // refunded/cancelled booking. Alert support to reconcile manually.
            console.error(
                `[PAYOUT_TERMINAL] Transfer confirmed for booking ${booking.id} in status ${booking.status}. ` +
                `Attempt ${attempt.id} needs manual reconciliation.`
            );
            throw new Error('PAYOUT_BOOKING_TERMINAL');
        }

        const money = moneyFromBooking(booking);
        assertSplitBalances(money);

        if (money.totalKobo > 0) {
            const escrow = await LedgerModel.getOrCreateAccount(client, 'escrow_holding', booking.id);
            const vendorPayable = await LedgerModel.getOrCreateAccount(client, 'vendor_payable', booking.id, booking.vendor_ledger_id);
            const revenue = await LedgerModel.getOrCreateAccount(client, 'platform_revenue');
            const tax = await LedgerModel.getOrCreateAccount(client, 'tax_payable');

            const legs = [
                { account: escrow, entryType: 'debit' as const, amountKobo: money.totalKobo, description: `Escrow release for booking ${booking.id}` },
                { account: vendorPayable, entryType: 'credit' as const, amountKobo: money.vendorNetKobo, description: `Vendor net for booking ${booking.id}` },
                { account: revenue, entryType: 'credit' as const, amountKobo: money.commissionKobo, description: `Platform commission for booking ${booking.id}` },
                { account: tax, entryType: 'credit' as const, amountKobo: money.vatKobo, description: `VAT payable for booking ${booking.id}` },
            ].filter((leg) => leg.amountKobo > 0);

            if (legs.length >= 2) {
                await LedgerModel.postBalancedEntry(client, `payout:${booking.id}`, legs);
            }
        }

        await client.query(
            `UPDATE payout_attempts
             SET status = 'succeeded',
                 paystack_transfer_code = COALESCE($2, paystack_transfer_code),
                 updated_at = NOW()
             WHERE id = $1`,
            [attempt.id, attemptRef.paystack_transfer_code ?? null]
        );
        await client.query(
            `UPDATE bookings SET status = 'payout_released' WHERE id = $1`,
            [booking.id]
        );

        if (ownsTransaction) await client.query('COMMIT');
        return {
            vendorEmail: booking.vendor_email,
            vendorName: booking.vendor_first_name,
            listingTitle: booking.listing_title,
            bookingRef: booking.booking_reference,
            money: {
                subtotal: money.subtotal,
                commission: money.commission,
                vat: money.vat,
                vendorNet: money.vendorNet,
            },
        };
    } catch (error) {
        if (ownsTransaction) await client.query('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        if (ownsTransaction) client.release();
    }
}

/**
 * Sweeps in-flight payout attempts and confirms them against Paystack's
 * verify-transfer endpoint. Covers missed/failed webhooks and crashes between
 * dispatch and confirmation.
 */
export async function runReconciliation(): Promise<void> {
    const db = getDB();

    const { rows: attempts } = await db.query(
        `SELECT * FROM payout_attempts
         WHERE status IN ('created', 'awaiting_webhook', 'processing')
           AND created_at < NOW() - interval '5 minutes'
         ORDER BY created_at ASC
         LIMIT 20`
    );

    for (const attempt of attempts) {
        try {
            const verified = await verifyTransfer(attempt.dispatch_reference);
            const status = verified?.data?.status;

            if (status === 'success') {
                const notification = await applyConfirmedPayout({
                    id: attempt.id,
                    booking_id: attempt.booking_id,
                    paystack_transfer_code: verified.data.transfer_code ?? attempt.paystack_transfer_code,
                    dispatch_reference: attempt.dispatch_reference,
                });
                if (notification) {
                    try {
                        await bookingEmailService.sendPayoutToVendor(
                            notification.vendorEmail, notification.vendorName,
                            notification.listingTitle, notification.bookingRef, notification.money
                        );
                    } catch (emailError) {
                        console.error('[reconciliation] payout email failed:', emailError);
                    }
                }
                console.log(`[reconciliation] Confirmed payout ${attempt.dispatch_reference}`);
            } else if (status === 'failed' || status === 'reversed') {
                await db.query(
                    `UPDATE payout_attempts SET status = 'failed', updated_at = NOW() WHERE id = $1`,
                    [attempt.id]
                );
                // Return the booking to the payable pool for a retry.
                await db.query(
                    `UPDATE bookings SET status = 'confirmed', payout_hold = FALSE
                     WHERE id = $1 AND status = 'processing_payout'`,
                    [attempt.booking_id]
                );
                console.warn(`[reconciliation] Payout ${attempt.dispatch_reference} ${status}`);
            }
            // 'pending' / 'otp' / unknown - leave for the next sweep.
        } catch (error) {
            console.error(`[reconciliation] Failed for ${attempt.dispatch_reference}:`, error);
        }
    }
}
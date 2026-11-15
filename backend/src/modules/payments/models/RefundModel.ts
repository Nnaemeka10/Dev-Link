import { getDB } from '../../../lib/db.js';
import type { PoolClient } from 'pg';
import { createPaystackRefund } from '../utils/paystack.js';
import { LedgerModel } from './LedgerModel.js';

export type RefundSource = 'user' | 'vendor_timeout' | 'vendor_decline' | 'admin';
export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'failed';

export interface RefundRow {
    id: string;
    booking_id: string;
    requested_by: number | null;
    amount_kobo: number;
    reason: string;
    description: string | null;
    status: RefundStatus;
    source: RefundSource;
    paystack_refund_code: string | null;
    processing_error: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    processed_at: string | null;
}

const REFUNDABLE = ['paid', 'funds_held', 'confirmed', 'completed'];
const TERMINAL = ['refunded', 'cancelled', 'declined', 'expired', 'failed'];

function dayStr(v: string | Date): string {
    if (v instanceof Date) {
        return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    }
    return String(v).split('T')[0];
}

/** Contiguous booked spans (mirrors Booking.resolveStay) so we release exactly what was blocked. */
function subRanges(start: string | Date, end: string | Date, excluded: (string | Date)[]): { from: string; to: string }[] {
    const cleanStart = dayStr(start);
    const cleanEnd = dayStr(end);
    const ex = new Set(excluded.map(dayStr));
    const out: { from: string; to: string }[] = [];
    let segStart: string | null = null;
    const startMs = new Date(cleanStart).getTime();
    const endMs = new Date(cleanEnd).getTime();
    for (let t = startMs; t <= endMs; t += 86400000) {
        const k = new Date(t).toISOString().split('T')[0];
        if (ex.has(k)) {
            if (segStart) { out.push({ from: segStart, to: new Date(t - 86400000).toISOString().split('T')[0] }); segStart = null; }
        } else if (!segStart) segStart = k;
    }
    if (segStart) out.push({ from: segStart, to: cleanEnd });
    return out;
}

/**
 * Idempotent DB finalization of a refund. Runs inside the caller's transaction.
 * Marks the booking refunded/cancelled, reverses the escrow ledger entry,
 * releases the calendar dates, and upserts the refund row.
 */
async function finalizeRefundInTx(
    client: PoolClient,
    booking: any,
    opts: {
        source: RefundSource;
        reason: string;
        description?: string | null;
        requestedBy?: number | null;
        amountKobo: number;
        paystackCode: string | null;
        status: RefundStatus;
    }
): Promise<RefundRow> {
    // vendor_timeout / vendor_decline → 'cancelled' (shows under Cancelled);
    // user/admin approved → 'refunded'.
    const finalStatus = opts.source === 'vendor_timeout' || opts.source === 'vendor_decline' ? 'cancelled' : 'refunded';

    if (!TERMINAL.includes(booking.status)) {
        await client.query(
            `UPDATE bookings
             SET status = $2, cancelled_at = NOW(), cancellation_reason = $3, payout_hold = TRUE
             WHERE id = $1`,
            [booking.id, finalStatus, opts.reason]
        );

        // Reverse the escrow inflow: debit escrow_holding, credit paystack_wallet.
        const escrow = await LedgerModel.getOrCreateAccount(client, 'escrow_holding', booking.id);
        const wallet = await LedgerModel.getOrCreateAccount(client, 'paystack_wallet');
        await LedgerModel.postBalancedEntry(client, `refund:${booking.id}`, [
            { account: escrow, entryType: 'debit', amountKobo: opts.amountKobo, description: `Refund escrow release for booking ${booking.id}`, paystackReference: booking.payment_reference ?? undefined },
            { account: wallet, entryType: 'credit', amountKobo: opts.amountKobo, description: `Refund paid out for booking ${booking.id}`, paystackReference: booking.payment_reference ?? undefined },
        ]);

        // Release the calendar dates this booking blocked.
        for (const r of subRanges(booking.start_date, booking.end_date, booking.excluded_dates ?? [])) {
            await client.query(
                `DELETE FROM listing_unavailable_dates
                 WHERE listing_id = $1 AND reason = 'booked' AND start_date = $2::date AND end_date = $3::date`,
                [booking.listing_id, r.from, r.to]
            );
        }
    }

    const res = await client.query<RefundRow>(
        `INSERT INTO refunds (booking_id, requested_by, amount_kobo, reason, description, status, source, paystack_refund_code, processed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $6 = 'completed' THEN NOW() ELSE NULL END)
         ON CONFLICT (booking_id) DO UPDATE SET
            status = EXCLUDED.status,
            source = EXCLUDED.source,
            reason = EXCLUDED.reason,
            description = EXCLUDED.description,
            paystack_refund_code = COALESCE(EXCLUDED.paystack_refund_code, refunds.paystack_refund_code),
            processing_error = NULL,
            processed_at = CASE WHEN EXCLUDED.status = 'completed' THEN NOW() ELSE refunds.processed_at END
         RETURNING *`,
        [booking.id, opts.requestedBy ?? null, opts.amountKobo, opts.reason, opts.description ?? null, opts.status, opts.source, opts.paystackCode]
    );
    return res.rows[0];
}

export const RefundModel = {
    async getForBooking(bookingId: string): Promise<RefundRow | null> {
        const db = getDB();
        const res = await db.query<RefundRow>(`SELECT * FROM refunds WHERE booking_id = $1`, [bookingId]);
        return res.rows[0] ?? null;
    },

    /**
     * Executes a FULL refund end to end. Paystack first, then idempotent DB
     * finalization. The refund.processed webhook is the reconciliation net if
     * the process dies between the two. Throws on Paystack failure (caller
     * records 'failed' and may retry).
     */
    async executeRefund(
        bookingId: string,
        opts: { source: RefundSource; reason: string; description?: string; requestedBy?: number | null }
    ): Promise<RefundRow> {
        const db = getDB();
        const { rows } = await db.query(
            `SELECT id, status, total_amount, received_amount, payment_reference, listing_id,
                    start_date, end_date, excluded_dates
             FROM bookings WHERE id = $1`,
            [bookingId]
        );
        const booking = rows[0];
        if (!booking) throw new Error('BOOKING_NOT_FOUND');

        // Idempotent: already terminal → return the existing refund row.
        if (TERMINAL.includes(booking.status)) {
            const existing = await this.getForBooking(bookingId);
            if (existing) return existing;
            throw new Error('INVALID_STATUS: Booking is not refundable');
        }
        if (!REFUNDABLE.includes(booking.status)) {
            throw new Error('INVALID_STATUS: Booking is not refundable');
        }
        if (!booking.payment_reference) throw new Error('NO_PAYMENT_REFERENCE');

        const amountKobo = Math.round(parseFloat(booking.total_amount) * 100);

        // 1. Paystack (network) — full refund of the transaction.
        let paystackCode: string | null = null;
        let status: RefundStatus = 'processing';
        try {
            const refund = await createPaystackRefund(booking.payment_reference);
            paystackCode = String(refund.data.id);
            status = refund.data.status === 'processed' ? 'completed' : 'processing';
        } catch (error: any) {
            await db.query(
                `INSERT INTO refunds (booking_id, requested_by, amount_kobo, reason, description, status, source, processing_error)
                 VALUES ($1, $2, $3, $4, $5, 'failed', $6, $7)
                 ON CONFLICT (booking_id) DO UPDATE SET status = 'failed', processing_error = EXCLUDED.processing_error`,
                [bookingId, opts.requestedBy ?? null, amountKobo, opts.reason, opts.description ?? null, opts.source, String(error?.message ?? error)]
            );
            throw error;
        }

        // 2. Idempotent DB finalization.
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const locked = await client.query(`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`, [bookingId]);
            const row = await finalizeRefundInTx(client, locked.rows[0], {
                source: opts.source,
                reason: opts.reason,
                description: opts.description ?? null,
                requestedBy: opts.requestedBy ?? null,
                amountKobo,
                paystackCode,
                status,
            });
            await client.query('COMMIT');
            return row;
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Refund webhook finalization (refund.processed / refund.failed).
     * Matches the booking by the original transaction reference.
     */
    async applyRefundWebhook(client: PoolClient, transactionReference: string, succeeded: boolean): Promise<void> {
        const { rows } = await client.query(
            `SELECT * FROM bookings WHERE payment_reference = $1 FOR UPDATE`,
            [transactionReference]
        );
        if (rows.length === 0) return;
        const booking = rows[0];
        const amountKobo = Math.round(parseFloat(booking.total_amount) * 100);

        if (succeeded) {
            await finalizeRefundInTx(client, booking, {
                source: 'admin',
                reason: booking.cancellation_reason ?? 'refund',
                amountKobo,
                paystackCode: null,
                status: 'completed',
            });
        } else {
            await client.query(
                `UPDATE refunds SET status = 'failed', processing_error = 'Paystack reported refund failure'
                 WHERE booking_id = $1`,
                [booking.id]
            );
        }
    },
};
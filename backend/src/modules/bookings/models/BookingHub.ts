import { getDB } from '../../../lib/db.js';
import {
    REFUND_REASONS,
    COMPLAINT_CATEGORIES,
    type BookingBucket,
    type BookingActions,
    type MyBookingItem,
    type HubBookingDetails,
    type RefundReason,
    type ComplaintCategory,
} from '../types/hub.js';

// Statuses a customer may request a refund against (funds still in escrow).
const REFUNDABLE_STATUSES = ['paid', 'funds_held', 'confirmed', 'completed'];
// Reviewing is allowed once the vendor confirmed (ongoing) or the event settled.
const REVIEWABLE_STATUSES = ['confirmed', 'completed', 'processing_payout', 'payout_released'];
const CANCELLED_STATUSES = ['cancelled', 'declined', 'refunded', 'failed'];
const COMPLETED_STATUSES = ['completed', 'processing_payout', 'payout_released'];

function dayStr(v: unknown): string {
    if (v instanceof Date) {
        return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    }
    return String(v).split('T')[0];
}
function iso(v: unknown): string | null {
    return v ? new Date(v as string | Date).toISOString() : null;
}
function todayStr(): string {
    return dayStr(new Date());
}
/** pg numerics arrive as strings; legacy rows may be null. Never return NaN. */
function num(v: unknown, fallback = 0): number {
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
    return Number.isFinite(n) ? n : fallback;
}

function bucketFor(status: string, endDate: string): BookingBucket {
    if (CANCELLED_STATUSES.includes(status)) return 'cancelled';
    if (COMPLETED_STATUSES.includes(status)) return 'completed';
    // A confirmed booking whose event has passed reads as completed even if
    // no job has flipped the status yet.
    if (endDate < todayStr()) return 'completed';
    return 'upcoming';
}

function actionsFor(row: any, bucket: BookingBucket): BookingActions {
    const refundBlocked = !!row.refund_status && !['rejected', 'failed'].includes(row.refund_status);
    return {
        canChat: true,
        canRequestRefund:
            row.refund_window_open === true &&
            REFUNDABLE_STATUSES.includes(row.status) &&
            !refundBlocked,
        canReview: REVIEWABLE_STATUSES.includes(row.status),
        canComplaint: true,
        canRebook: bucket !== 'upcoming',
        canDownloadReceipt: !!row.paid_at,
    };
}

/**
 * Shared projection. Unpaid checkout attempts (pending/expired, and failed
 * without a captured payment) are excluded — the hub shows real bookings.
 * The refund window falls back to end_date + 24h for legacy rows.
 *
 * IMPORTANT: every alias referenced in HUB_SELECT must be joined here.
 * `sp` (service_packages) lives in this shared FROM so findMine and
 * findHubDetails both resolve package_name.
 */
const HUB_FROM = `
    FROM bookings b
    JOIN listings l ON l.id = b.listing_id
    JOIN users vu ON vu.id = l.vendor_id
    LEFT JOIN service_packages sp ON sp.id = b.package_id
    LEFT JOIN refunds r ON r.booking_id = b.id
    LEFT JOIN listing_reviews lr ON lr.booking_id = b.id
`;

const HUB_SELECT = `
    SELECT
        b.id, b.booking_reference, b.status, b.payment_status,
        b.start_date, b.end_date, b.start_time, b.end_time, b.excluded_dates,
        b.total_amount, b.currency, b.guests, b.paid_at, b.created_at,
        b.cancelled_at, b.cancellation_reason, b.event_location,
        b.dispute_window_closes_at,
        COALESCE(b.dispute_window_closes_at, (b.end_date + interval '24 hours') AT TIME ZONE 'UTC')
            AS refund_window_closes_at,
        COALESCE(b.dispute_window_closes_at, (b.end_date + interval '24 hours') AT TIME ZONE 'UTC') > NOW()
            AS refund_window_open,
        l.id AS listing_id, l.kind, l.title AS listing_title,
        l.city AS listing_city, l.state AS listing_state, l.address_line,
        l.capacity AS listing_capacity,
        (SELECT la.url FROM listing_assets la
          WHERE la.listing_id = l.id AND la.is_primary = true LIMIT 1) AS listing_image,
        vu.first_name AS vendor_first_name, vu.last_name AS vendor_last_name,
        vu.email AS vendor_email, vu.phone AS vendor_phone,
        sp.name AS package_name,
        r.status AS refund_status, r.reason AS refund_reason,
        r.description AS refund_description, r.source AS refund_source,
        r.created_at AS refund_created_at, r.processed_at AS refund_processed_at,
        lr.id AS review_id, lr.rating AS review_rating, lr.body AS review_body,
        lr.sub_ratings AS review_sub_ratings
`;

function mapItem(row: any): MyBookingItem {
    const startDate = dayStr(row.start_date);
    const endDate = dayStr(row.end_date);
    const bucket = bucketFor(row.status, endDate);
    const hallLocation = [row.address_line, row.listing_city, row.listing_state]
        .filter(Boolean).join(', ') || null;
    const eventLocation = row.event_location ?? null;

    return {
        id: row.id,
        bookingReference: row.booking_reference,
        status: row.status,
        bucket,
        kind: row.kind,
        listingId: row.listing_id,
        listingTitle: row.listing_title,
        listingImage: row.listing_image ?? null,
        location: row.kind === 'hall' ? hallLocation : eventLocation,
        eventLocation,
        startDate,
        endDate,
        startTime: row.start_time ?? null,
        endTime: row.end_time ?? null,
        excludedDates: (row.excluded_dates ?? []).map(dayStr),
        totalAmount: num(row.total_amount),
        currency: row.currency ?? 'NGN',
        guests: row.guests ?? 1,
        paidAt: iso(row.paid_at),
        createdAt: iso(row.created_at)!,
        cancelledAt: iso(row.cancelled_at),
        cancellationReason: row.cancellation_reason ?? null,
        vendorName: [row.vendor_first_name, row.vendor_last_name].filter(Boolean).join(' ') || 'Vendor',
        refundStatus: row.refund_status ?? null,
        refundWindowClosesAt: iso(row.refund_window_closes_at),
        refundWindowOpen: row.refund_window_open === true,
        hasReview: !!row.review_id,
        myReviewRating: row.review_rating != null ? num(row.review_rating) : null,
        actions: actionsFor(row, bucket),
    };
}

export const BookingHubModel = {
    /** Every real booking for the user, bucketed, with server-computed actions. */
    async findMine(userId: number): Promise<MyBookingItem[]> {
        const db = getDB();
        const { rows } = await db.query(
            `${HUB_SELECT} ${HUB_FROM}
             WHERE b.user_id = $1
               AND b.status NOT IN ('pending', 'expired')
               AND (b.status <> 'failed' OR b.paid_at IS NOT NULL)
             ORDER BY b.start_date DESC, b.created_at DESC`,
            [userId]
        );
        return rows.map(mapItem);
    },

    /** Enriched single booking for the hub modal. Ownership enforced here. */
    async findHubDetails(bookingId: string, userId: number): Promise<HubBookingDetails | null> {
        const db = getDB();
        const { rows } = await db.query(
            `${HUB_SELECT} ${HUB_FROM}
             WHERE b.id = $2 AND b.user_id = $1`,
            [userId, bookingId]
        );
        if (rows.length === 0) return null;
        const row = rows[0];
        const base = mapItem(row);

        const total = base.totalAmount;
        const subtotal = Math.round((total / 1.075) * 100) / 100;
        const vat = Math.round((total - subtotal) * 100) / 100;

        return {
            ...base,
            subtotal,
            vat,
            packageName: row.package_name ?? null,
            listingCapacity: row.listing_capacity ?? null,
            listingCity: row.listing_city ?? null,
            listingState: row.listing_state ?? null,
            listingAddress: row.address_line ?? null,
            vendorFirstName: row.vendor_first_name ?? null,
            vendorLastName: row.vendor_last_name ?? null,
            vendorEmail: row.vendor_email ?? null,
            vendorPhone: row.vendor_phone ?? null,
            myReview: row.review_id
                ? {
                    rating: num(row.review_rating),
                    body: row.review_body ?? null,
                    subRatings: (row.review_sub_ratings ?? {}) as Record<string, number>,
                }
                : null,
            refund: row.refund_status
                ? {
                    status: row.refund_status,
                    reason: row.refund_reason,
                    description: row.refund_description ?? null,
                    source: row.refund_source,
                    createdAt: iso(row.refund_created_at)!,
                    processedAt: iso(row.refund_processed_at),
                }
                : null,
        };
    },

    /**
     * User-initiated FULL refund request → 'pending' (support reviews it).
     * Window: until dispute_window_closes_at (event end + 24h), matching the
     * escrow payout logic. Re-request allowed only after rejection/failure.
     * Throws sentinel errors the controller maps to HTTP codes.
     */
    async requestRefund(
        bookingId: string,
        userId: number,
        input: { reason: RefundReason; description: string }
    ): Promise<{ refundId: string; bookingReference: string; listingTitle: string; totalAmount: number; customerEmail: string; customerName: string }> {
        if (!REFUND_REASONS.includes(input.reason)) throw new Error('INVALID_REASON');
        const description = (input.description ?? '').trim();
        if (description.length < 10) throw new Error('DESCRIPTION_TOO_SHORT');

        const db = getDB();
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const { rows } = await client.query(
                `SELECT b.id, b.status, b.total_amount, b.booking_reference, b.user_id,
                        l.title AS listing_title,
                        cu.email AS customer_email, cu.first_name AS customer_name,
                        COALESCE(b.dispute_window_closes_at, (b.end_date + interval '24 hours') AT TIME ZONE 'UTC') > NOW()
                            AS window_open,
                        r.status AS existing_refund_status
                 FROM bookings b
                 JOIN listings l ON l.id = b.listing_id
                 JOIN users cu ON cu.id = b.user_id
                 LEFT JOIN refunds r ON r.booking_id = b.id
                 WHERE b.id = $1
                 FOR UPDATE OF b`,
                [bookingId]
            );
            const booking = rows[0];
            if (!booking) throw new Error('BOOKING_NOT_FOUND');
            if (Number(booking.user_id) !== Number(userId)) throw new Error('FORBIDDEN');
            if (!REFUNDABLE_STATUSES.includes(booking.status)) throw new Error('INVALID_STATUS');
            if (!booking.window_open) throw new Error('REFUND_WINDOW_CLOSED');
            if (booking.existing_refund_status && !['rejected', 'failed'].includes(booking.existing_refund_status)) {
                throw new Error('REFUND_ALREADY_REQUESTED');
            }

            const amountKobo = Math.round(num(booking.total_amount) * 100);
            const upsert = await client.query(
                `INSERT INTO refunds (booking_id, requested_by, amount_kobo, reason, description, status, source)
                 VALUES ($1, $2, $3, $4, $5, 'pending', 'user')
                 ON CONFLICT (booking_id) DO UPDATE SET
                    requested_by = EXCLUDED.requested_by,
                    reason = EXCLUDED.reason,
                    description = EXCLUDED.description,
                    status = 'pending',
                    source = 'user',
                    processing_error = NULL,
                    reviewed_by = NULL,
                    reviewed_at = NULL,
                    created_at = NOW()
                 WHERE refunds.status IN ('rejected', 'failed')
                 RETURNING id`,
                [bookingId, userId, amountKobo, input.reason, description]
            );
            if (upsert.rows.length === 0) throw new Error('REFUND_ALREADY_REQUESTED');

            await client.query('COMMIT');
            return {
                refundId: upsert.rows[0].id,
                bookingReference: booking.booking_reference,
                listingTitle: booking.listing_title,
                totalAmount: num(booking.total_amount),
                customerEmail: booking.customer_email,
                customerName: booking.customer_name,
            };
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    },

    /** Complaint → stored for the future admin app + emailed to support. */
    async createComplaint(
        bookingId: string,
        userId: number,
        input: { category: ComplaintCategory; subject?: string; message: string }
    ): Promise<{ complaintId: string; bookingReference: string; listingTitle: string; customerEmail: string; customerName: string }> {
        if (!COMPLAINT_CATEGORIES.includes(input.category)) throw new Error('INVALID_CATEGORY');
        const message = (input.message ?? '').trim();
        if (message.length < 10) throw new Error('MESSAGE_TOO_SHORT');

        const db = getDB();
        const { rows } = await db.query(
            `SELECT b.id, b.user_id, b.listing_id, b.booking_reference,
                    l.title AS listing_title, cu.email AS customer_email, cu.first_name AS customer_name
             FROM bookings b
             JOIN listings l ON l.id = b.listing_id
             JOIN users cu ON cu.id = b.user_id
             WHERE b.id = $1`,
            [bookingId]
        );
        const booking = rows[0];
        if (!booking) throw new Error('BOOKING_NOT_FOUND');
        if (Number(booking.user_id) !== Number(userId)) throw new Error('FORBIDDEN');

        const inserted = await db.query(
            `INSERT INTO complaints (booking_id, listing_id, user_id, category, subject, message)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [bookingId, booking.listing_id, userId, input.category, (input.subject ?? '').trim() || null, message]
        );
        return {
            complaintId: inserted.rows[0].id,
            bookingReference: booking.booking_reference,
            listingTitle: booking.listing_title,
            customerEmail: booking.customer_email,
            customerName: booking.customer_name,
        };
    },
};
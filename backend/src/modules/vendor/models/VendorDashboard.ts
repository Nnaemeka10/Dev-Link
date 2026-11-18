// src/modules/vendor/models/VendorDashboard.ts
import { getDB } from '../../../lib/db.js';

/**
 * Vendor earnings are NET: subtotal − 10% commission. VAT is a pass-through
 * liability and must never appear as vendor revenue.
 * The inner COALESCE keeps pre-031 rows on their original total − fee
 * definition.
 */
const NET_REVENUE_EXPR = `COALESCE(b.subtotal_amount - b.platform_fee, b.total_amount - b.platform_fee)`;

/** Money the vendor has EARNED - the event is locked in, refund risk is gone. */
const EARNED_STATUSES = `('confirmed', 'completed', 'processing_payout', 'payout_released')`;

/**
 * Tab buckets. Single source of truth: the SAME predicate drives the list
 * query and the summary counts, so a tab badge can never disagree with the
 * rows under it.
 * `pending`  = paid, awaiting the vendor's decision (the actionable queue).
 * `upcoming` = confirmed and still ahead of us.
 * `completed`= settled payouts, plus confirmed events whose date has passed
 *              (the payout worker may not have swept them yet).
 * Buckets are mutually exclusive and cover every real booking.
 */
const STATUS_FILTERS: Record<string, string> = {
    pending: `AND b.status IN ('paid', 'funds_held')`,
    upcoming: `AND b.status = 'confirmed' AND b.end_date >= CURRENT_DATE`,
    completed: `AND (b.status IN ('completed', 'processing_payout', 'payout_released') OR (b.status = 'confirmed' AND b.end_date < CURRENT_DATE))`,
    cancelled: `AND b.status IN ('cancelled', 'declined', 'refunded')`,
    // Legacy fallback for any caller still asking for "all".
    all: `AND b.status NOT IN ('pending', 'failed', 'expired')`,
};

/** ORDER BY whitelist - user input never reaches SQL as free text. */
const SORT_CLAUSES: Record<string, string> = {
    newest: `ORDER BY b.created_at DESC, b.id DESC`,
    oldest: `ORDER BY b.created_at ASC, b.id ASC`,
    event_soonest: `ORDER BY b.start_date ASC, b.created_at DESC, b.id DESC`,
    amount_desc: `ORDER BY b.total_amount DESC NULLS LAST, b.created_at DESC, b.id DESC`,
    amount_asc: `ORDER BY b.total_amount ASC NULLS LAST, b.created_at DESC, b.id ASC`,
};

export const BOOKING_SORT_KEYS = Object.keys(SORT_CLAUSES);
export const BOOKING_FILTER_KEYS = ['pending', 'upcoming', 'completed', 'cancelled'];

/** Decline reasons the vendor may pick. Mirrored in features/vendor/types.ts. */
export const DECLINE_REASONS: Record<string, string> = {
    dates_unavailable: 'Dates are no longer available',
    fully_booked: 'Fully booked for this period',
    cannot_fulfil: 'Unable to fulfil this request',
    incorrect_details: 'Booking details are incorrect',
    other: 'Other',
};

const MAX_PER_PAGE = 50;

export function clampPerPage(value: unknown, fallback = 10): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return Math.min(parsed, MAX_PER_PAGE);
}

export function resolveFilter(value: unknown): string {
    const key = String(value ?? 'pending');
    return STATUS_FILTERS[key] ? key : 'pending';
}

export function resolveSort(value: unknown): string {
    const key = String(value ?? 'newest');
    return SORT_CLAUSES[key] ? key : 'newest';
}

/** pg returns DATE as JS Date and DATE[] as Date[] - normalize to ISO days. */
function dayStr(v: unknown): string {
    if (v instanceof Date) {
        return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    }
    return String(v ?? '').split('T')[0];
}

export function mapExcludedDates(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map(dayStr).filter(Boolean).sort();
}

const BOOKING_FROM = `FROM bookings b JOIN listings l ON l.id = b.listing_id JOIN users cu ON cu.id = b.user_id LEFT JOIN service_packages sp ON sp.id = b.package_id LEFT JOIN refunds r ON r.booking_id = b.id`;

const BOOKING_SELECT = `SELECT b.id, b.booking_reference, b.status, b.payment_status, to_char(b.start_date, 'YYYY-MM-DD') AS start_date, to_char(b.end_date, 'YYYY-MM-DD') AS end_date, b.excluded_dates, b.start_time, b.end_time, b.guests, b.total_amount, b.subtotal_amount, b.vat_amount, b.platform_fee, b.currency, b.paid_at, b.created_at, b.event_location, b.preferences, b.cancelled_at, b.cancellation_reason, b.dispute_window_closes_at, b.payout_hold, ${NET_REVENUE_EXPR} AS vendor_net, l.id AS listing_id, l.title AS listing_name, l.kind AS listing_kind, l.address_line, l.city, l.state, l.capacity, cu.first_name AS client_first_name, cu.last_name AS client_last_name, cu.avatar_url AS client_avatar_url, cu.email AS client_email, cu.phone AS client_phone, sp.name AS package_name, r.status AS refund_status, r.reason AS refund_reason, r.description AS refund_description, r.amount_kobo AS refund_amount_kobo, r.created_at AS refund_created_at, r.processed_at AS refund_processed_at`;

/** Most relevant payout attempt for a booking: the succeeded one, else newest. */
const PAYOUT_LATERAL = `LEFT JOIN LATERAL ( SELECT pa.status, pa.dispatch_reference, pa.paystack_transfer_code, pa.amount_kobo, pa.created_at, pa.updated_at FROM payout_attempts pa WHERE pa.booking_id = b.id ORDER BY (pa.status = 'succeeded') DESC, pa.created_at DESC LIMIT 1 ) pa ON TRUE`;

/**
 * Ledger-backed transaction rows. Scoped to vendor_payable CREDITS, which
 * only exist once a transfer has been confirmed - so every row here is a
 * completed payout, never a pending intent.
 */
const TXN_FROM = `FROM ledger_entries le JOIN ledger_accounts la ON la.id = le.account_id JOIN vendors v ON v.id = la.vendor_id LEFT JOIN bookings b ON b.id = la.booking_id LEFT JOIN listings l ON l.id = b.listing_id LEFT JOIN users cu ON cu.id = b.user_id`;

const TXN_WHERE = `WHERE v.user_id = $1 AND la.account_type = 'vendor_payable' AND le.entry_type = 'credit'`;

export const VendorDashboardModel = {
    /**
     * Earned revenue (confirmed and beyond), actual paid-out cash, per-tab
     * counts, 30-day momentum and the next scheduled payout.
     * Cancelled / refunded bookings drop out of every money figure by status.
     */
    async getFinancialSummary(userId: number) {
        const db = getDB();
        const res = await db.query(
            `SELECT COALESCE(SUM(${NET_REVENUE_EXPR}) FILTER (WHERE b.status IN ${EARNED_STATUSES}), 0) AS total_revenue, COALESCE(SUM(${NET_REVENUE_EXPR}) FILTER (WHERE b.status = 'payout_released'), 0) AS paid_out, COUNT(*) FILTER (WHERE b.status IN ('confirmed', 'processing_payout', 'payout_released')) AS confirmed_bookings, COUNT(*) FILTER (WHERE b.status IN ('paid', 'funds_held')) AS pending_bookings, COUNT(*) FILTER (WHERE b.status IN ('paid', 'funds_held')) AS count_pending, COUNT(*) FILTER (WHERE b.status = 'confirmed' AND b.end_date >= CURRENT_DATE) AS count_upcoming, COUNT(*) FILTER ( WHERE b.status IN ('completed', 'processing_payout', 'payout_released') OR (b.status = 'confirmed' AND b.end_date < CURRENT_DATE) ) AS count_completed, COUNT(*) FILTER (WHERE b.status IN ('cancelled', 'declined', 'refunded')) AS count_cancelled, COUNT(*) FILTER (WHERE b.status NOT IN ('pending', 'failed', 'expired')) AS count_all, COALESCE(SUM(${NET_REVENUE_EXPR}) FILTER ( WHERE b.status IN ${EARNED_STATUSES} AND b.created_at >= NOW() - INTERVAL '30 days' ), 0) AS revenue_last_30, COALESCE(SUM(${NET_REVENUE_EXPR}) FILTER ( WHERE b.status IN ${EARNED_STATUSES} AND b.created_at >= NOW() - INTERVAL '60 days' AND b.created_at < NOW() - INTERVAL '30 days' ), 0) AS revenue_prev_30 FROM bookings b JOIN listings l ON l.id = b.listing_id WHERE l.vendor_id = $1`,
            [userId]
        );

        // Matches the payout worker's real trigger (confirmed + window closed).
        const payoutRes = await db.query(
            `SELECT b.dispute_window_closes_at, b.listing_id, l.title AS listing_title
             FROM bookings b
             JOIN listings l ON l.id = b.listing_id
             WHERE l.vendor_id = $1
               AND b.status IN ('confirmed', 'funds_held', 'completed')
               AND b.payout_hold = FALSE
               AND b.dispute_window_closes_at > NOW()
             ORDER BY b.dispute_window_closes_at ASC
             LIMIT 1`,
            [userId]
        );

        return { ...res.rows[0], nextPayout: payoutRes.rows[0] || null };
    },

    /** Net revenue bucketed by month for the trailing 6 months. */
    async getRevenueTrend(userId: number) {
        const db = getDB();
        const res = await db.query(
            `SELECT TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon') AS month, COALESCE(SUM(${NET_REVENUE_EXPR}), 0) AS revenue FROM bookings b JOIN listings l ON l.id = b.listing_id WHERE l.vendor_id = $1 AND b.created_at > NOW() - INTERVAL '6 months' AND b.status = 'payout_released' GROUP BY DATE_TRUNC('month', b.created_at) ORDER BY DATE_TRUNC('month', b.created_at) ASC`,
            [userId]
        );
        return res.rows;
    },

    /** Paginated completed payouts, newest first. */
    async getTransactions(userId: number, limit: number, offset: number) {
        const db = getDB();
        const [rowsRes, countRes] = await Promise.all([
            db.query(
                `SELECT le.id, le.amount_kobo, le.created_at, le.paystack_reference, le.entry_type AS direction, b.id AS booking_id, b.booking_reference, l.title AS listing_title, l.kind AS listing_kind, cu.first_name AS client_first_name, cu.last_name AS client_last_name ${TXN_FROM} ${TXN_WHERE} ORDER BY le.created_at DESC, le.id DESC LIMIT $2 OFFSET $3`,
                [userId, limit, offset]
            ),
            db.query(`SELECT COUNT(*)::int AS total ${TXN_FROM} ${TXN_WHERE}`, [userId]),
        ]);
        return { rows: rowsRes.rows, totalItems: Number(countRes.rows[0]?.total ?? 0) };
    },

    /** One completed payout with every detail the receipt/detail page needs. */
    async getTransactionById(userId: number, entryId: string) {
        const db = getDB();
        const res = await db.query(
            // booking_created_at is the BOOKING's creation instant (distinct
            // from le.created_at, which is when the payout ledger entry was
            // written). The receipt shows "Booked on" from this alias.
            `SELECT le.id, le.description, le.amount_kobo, le.created_at, le.paystack_reference, le.transaction_group, le.idempotency_key, le.entry_type AS direction, b.id AS booking_id, b.booking_reference, b.status AS booking_status, to_char(b.start_date, 'YYYY-MM-DD') AS start_date, to_char(b.end_date, 'YYYY-MM-DD') AS end_date, b.excluded_dates, b.start_time, b.end_time, b.guests, b.total_amount, b.subtotal_amount, b.vat_amount, b.platform_fee, b.currency, b.paid_at, b.created_at AS booking_created_at, b.event_location, b.preferences, b.dispute_window_closes_at, ${NET_REVENUE_EXPR} AS vendor_net, l.id AS listing_id, l.title AS listing_title, l.kind AS listing_kind, l.address_line, l.city, l.state, cu.first_name AS client_first_name, cu.last_name AS client_last_name, cu.avatar_url AS client_avatar_url, sp.name AS package_name, pa.status AS payout_status, pa.dispatch_reference, pa.paystack_transfer_code, pa.created_at AS payout_created_at, pa.updated_at AS payout_updated_at, bd.name AS bank_name, v.account_number_last4, v.resolved_account_name ${TXN_FROM} LEFT JOIN service_packages sp ON sp.id = b.package_id ${PAYOUT_LATERAL} LEFT JOIN bank_directory bd ON bd.code = v.bank_code ${TXN_WHERE} AND le.id = $2`,
            [userId, entryId]
        );
        return res.rows[0] ?? null;
    },

    /** Vendor bookings: offset pagination, whitelisted sort, bucket filter. */
    async getBookings(userId: number, filter: string, page: number, perPage: number, sort: string) {
        const db = getDB();
        const offset = (page - 1) * perPage;
        const statusCondition = STATUS_FILTERS[filter] ?? STATUS_FILTERS.pending;
        const orderClause = SORT_CLAUSES[sort] ?? SORT_CLAUSES.newest;

        const [res, countRes] = await Promise.all([
            db.query(
                `${BOOKING_SELECT} ${BOOKING_FROM}
                 WHERE l.vendor_id = $1 ${statusCondition}
                 ${orderClause}
                 LIMIT $2 OFFSET $3`,
                [userId, perPage, offset]
            ),
            db.query(
                `SELECT COUNT(*)::int AS total
                 FROM bookings b JOIN listings l ON l.id = b.listing_id
                 WHERE l.vendor_id = $1 ${statusCondition}`,
                [userId]
            ),
        ]);

        return { bookings: res.rows, totalItems: Number(countRes.rows[0]?.total ?? 0) };
    },

    /** Full booking detail. Ownership enforced in the WHERE, never after. */
    async getBookingById(userId: number, bookingId: string) {
        const db = getDB();
        const res = await db.query(
            `${BOOKING_SELECT}, pa.status AS payout_status, pa.dispatch_reference, pa.paystack_transfer_code, pa.amount_kobo AS payout_amount_kobo, pa.created_at AS payout_created_at, pa.updated_at AS payout_updated_at ${BOOKING_FROM} ${PAYOUT_LATERAL} WHERE l.vendor_id = $1 AND b.id = $2`,
            [userId, bookingId]
        );
        return res.rows[0] ?? null;
    },

    /** Aggregates for the My Listings page. */
    async getMyListingsStats(userId: number) {
        const db = getDB();
        const res = await db.query(
            `SELECT COUNT(*) AS total_listings, COUNT(*) FILTER (WHERE status = 'published') AS active_listings, COALESCE(AVG(average_rating), 0) AS avg_rating, (SELECT COUNT(*) FROM listing_view_events lve JOIN listings l2 ON l2.id = lve.listing_id WHERE l2.vendor_id = $1 AND lve.viewed_at > NOW() - INTERVAL '30 days') AS views_last_30_days FROM listings WHERE vendor_id = $1 AND deleted_at IS NULL`,
            [userId]
        );
        return res.rows[0];
    },
};
// src/modules/vendor/models/VendorDashboard.ts
import { getDB } from '../../../lib/db.js';

/**
 * Vendor earnings are NET: subtotal − 10% commission. VAT is a pass-through
 * liability and must never appear as vendor revenue.
 * The inner COALESCE keeps pre-031 rows on their original total − fee
 * definition; drop it after the database wipe.
 */
const NET_REVENUE_EXPR = `COALESCE(b.subtotal_amount - b.platform_fee, b.total_amount - b.platform_fee)`;

/** Single source of truth for tab buckets - used by getBookings AND the counts. */
const STATUS_FILTERS: Record<string, string> = {
  upcoming: `AND b.status IN ('paid', 'funds_held', 'confirmed')`,
  completed: `AND b.status IN ('completed', 'processing_payout', 'payout_released')`,
  cancelled: `AND b.status IN ('cancelled', 'declined', 'refunded')`,
  all: `AND b.status NOT IN ('pending', 'failed', 'expired')`,
};

export const VendorDashboardModel = {
  /**
   * Net revenue (payout_released only), confirmed/pending counts,
   * per-tab counts, and the next scheduled payout.
   */
  async getFinancialSummary(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT
        COALESCE(SUM(${NET_REVENUE_EXPR}) FILTER (WHERE b.status = 'payout_released'), 0) AS total_revenue,
        COUNT(*) FILTER (WHERE b.status IN ('confirmed', 'processing_payout', 'payout_released')) AS confirmed_bookings,
        COUNT(*) FILTER (WHERE b.status IN ('paid', 'funds_held')) AS pending_bookings,
        COUNT(*) FILTER (WHERE b.status NOT IN ('pending', 'failed', 'expired')) AS count_all,
        COUNT(*) FILTER (WHERE b.status IN ('paid', 'funds_held', 'confirmed')) AS count_upcoming,
        COUNT(*) FILTER (WHERE b.status IN ('completed', 'processing_payout', 'payout_released')) AS count_completed,
        COUNT(*) FILTER (WHERE b.status IN ('cancelled', 'declined', 'refunded')) AS count_cancelled
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE l.vendor_id = $1`,
      [userId]
    );

    // Matches the payout worker's real trigger. The old 'funds_held'-only
    // filter never matched card bookings, so this was permanently null.
    const payoutRes = await db.query(
      `SELECT b.dispute_window_closes_at, b.listing_id, l.title AS listing_title
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE l.vendor_id = $1
         AND b.status IN ('paid', 'funds_held', 'confirmed')
         AND b.payout_hold = FALSE
         AND b.dispute_window_closes_at > NOW()
       ORDER BY b.dispute_window_closes_at ASC
       LIMIT 1`,
      [userId]
    );

    return {
      ...res.rows[0],
      nextPayout: payoutRes.rows[0] || null,
    };
  },

  /** Net revenue bucketed by month for the trailing 6 months. */
  async getRevenueTrend(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon') AS month,
        COALESCE(SUM(${NET_REVENUE_EXPR}), 0) AS revenue
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE l.vendor_id = $1
         AND b.created_at > NOW() - INTERVAL '6 months'
         AND b.status = 'payout_released'
       GROUP BY DATE_TRUNC('month', b.created_at)
       ORDER BY DATE_TRUNC('month', b.created_at) ASC`,
      [userId]
    );
    return res.rows;
  },

  /**
   * Transaction history from the ledger, scoped to vendor_payable so
   * commission and VAT legs can never surface as vendor money.
   */
  async getTransactions(userId: number, limit: number = 5) {
    const db = getDB();
    const res = await db.query(
      `SELECT
        le.id, le.description, le.amount_kobo, le.created_at, le.paystack_reference,
        le.entry_type AS direction,
        b.booking_reference,
        l.title AS listing_title,
        l.kind AS listing_kind
       FROM ledger_entries le
       JOIN ledger_accounts la ON la.id = le.account_id
       JOIN vendors v ON v.id = la.vendor_id
       LEFT JOIN bookings b ON b.id = la.booking_id
       LEFT JOIN listings l ON l.id = b.listing_id
       WHERE v.user_id = $1
         AND la.account_type = 'vendor_payable'
       ORDER BY le.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  },

  /** Vendor bookings with dynamic filtering and pagination. */
  async getBookings(userId: number, filter: string, page: number, perPage: number) {
    const db = getDB();
    const offset = (page - 1) * perPage;
    const statusCondition = STATUS_FILTERS[filter] ?? STATUS_FILTERS.all;

    const res = await db.query(
      `SELECT
        b.id, b.booking_reference, b.start_date, b.end_date, b.start_time, b.end_time,
        b.status, b.total_amount, b.created_at,
        l.title AS listing_name, l.kind AS listing_type,
        u.first_name AS client_first_name, u.last_name AS client_last_name, u.avatar_url AS client_avatar_url
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       JOIN users u ON u.id = b.user_id
       WHERE l.vendor_id = $1 ${statusCondition}
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, perPage, offset]
    );

    const countRes = await db.query(
      `SELECT COUNT(*)
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE l.vendor_id = $1 ${statusCondition}`,
      [userId]
    );

    return {
      bookings: res.rows,
      totalItems: parseInt(countRes.rows[0].count, 10),
    };
  },

  /** Aggregates stats for the My Listings page. */
  async getMyListingsStats(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT
        COUNT(*) AS total_listings,
        COUNT(*) FILTER (WHERE status = 'published') AS active_listings,
        COALESCE(AVG(average_rating), 0) AS avg_rating,
        (SELECT COUNT(*) FROM listing_view_events lve
         JOIN listings l2 ON l2.id = lve.listing_id
         WHERE l2.vendor_id = $1 AND lve.viewed_at > NOW() - INTERVAL '30 days') AS views_last_30_days
       FROM listings
       WHERE vendor_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return res.rows[0];
  },
};
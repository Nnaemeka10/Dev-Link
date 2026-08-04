// src/modules/vendor/models/VendorDashboardModel.ts
import { getDB } from '../../../lib/db.js';

export const VendorDashboardModel = {
  /**
   * Computes total revenue, confirmed bookings, and pending bookings.
   * Revenue is strictly defined as funds that have reached 'payout_released' status.
   */
    async getFinancialSummary(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT 
        -- FIX: FILTER goes directly on SUM, inside COALESCE
        COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'payout_released'), 0) AS total_revenue,
        COUNT(*) FILTER (WHERE b.status IN ('confirmed', 'funds_held', 'paid', 'processing_payout', 'payout_released')) AS confirmed_bookings,
        COUNT(*) FILTER (WHERE b.status = 'pending') AS pending_bookings
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE l.vendor_id = $1`,
      [userId]
    );
    
    // Find the next upcoming payout date (dispute window close date for active bookings)
    const payoutRes = await db.query(
      `SELECT b.dispute_window_closes_at, b.listing_id, l.title as listing_title
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE l.vendor_id = $1 
       AND b.status = 'funds_held' 
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
  /**
   * Revenue trend bucketed by month for the trailing 6 months.
   */
  async getRevenueTrend(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon') AS month,
        COALESCE(SUM(b.total_amount), 0) AS revenue
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE l.vendor_id = $1 
       AND b.created_at > NOW() - INTERVAL '6 months'
       AND b.status = 'payout_released'
       GROUP BY month
       ORDER BY MIN(b.created_at) ASC`,
      [userId]
    );
    return res.rows;
  },

  /**
   * Reads transaction history directly from the escrow ledger_entries table.
   */
  async getTransactions(userId: number, limit: number = 5) {
    const db = getDB();
    const res = await db.query(
      `SELECT 
        le.id, le.description, le.amount_kobo, le.created_at, le.paystack_reference,
        le.entry_type as direction
       FROM ledger_entries le
       JOIN ledger_accounts la ON la.id = le.account_id
       JOIN vendors v ON v.id = la.vendor_id
       WHERE v.user_id = $1
       ORDER BY le.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  },

  /**
   * Fetches vendor bookings with dynamic filtering and pagination.
   */
  async getBookings(userId: number, filter: string, page: number, perPage: number) {
    const db = getDB();
    const offset = (page - 1) * perPage;
    
    let statusCondition = '';
    const params: any[] = [userId, perPage, offset];

    if (filter === 'upcoming') {
      statusCondition = `AND b.status IN ('confirmed', 'funds_held', 'paid')`;
    } else if (filter === 'completed') {
      statusCondition = `AND b.status IN ('completed', 'payout_released')`;
    } else if (filter === 'cancelled') {
      statusCondition = `AND b.status = 'cancelled'`;
    }

    const res = await db.query(
      `SELECT 
        b.id, b.booking_reference, b.start_date, b.end_date, b.start_time, b.end_time,
        b.status, b.total_amount, b.created_at,
        l.title as listing_name, l.kind as listing_type,
        u.first_name as client_first_name, u.last_name as client_last_name, u.avatar_url as client_avatar_url
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       JOIN users u ON u.id = b.user_id
       WHERE l.vendor_id = $1 ${statusCondition}
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      params
    );

    // Get total count for pagination
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

  /**
   * Aggregates stats for the My Listings page (Total, Active, Views, Rating).
   */
  async getMyListingsStats(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT 
        COUNT(*) as total_listings,
        COUNT(*) FILTER (WHERE status = 'published') as active_listings,
        COALESCE(AVG(average_rating), 0) as avg_rating,
        (SELECT COUNT(*) FROM listing_view_events lve 
         JOIN listings l2 ON l2.id = lve.listing_id 
         WHERE l2.vendor_id = $1 AND lve.viewed_at > NOW() - INTERVAL '30 days') as views_last_30_days
       FROM listings
       WHERE vendor_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return res.rows[0];
  }
};
import { getDB } from '../../../lib/db.js';
import cloudinary from '../../../lib/cloudinary.js';
import { ENV } from '../../../lib/env.js';

export const VendorListingModel = {

    /**
   * Fetches every listing owned by this vendor, with lightweight 30-day
   * engagement stats (views, bookings) joined in for the My Listings grid.
   */
  async getListingsByVendor(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT
         l.id,
         l.title,
         CONCAT_WS(', ', l.city, l.state) AS location,
         l.status,
         l.base_price_kobo,
         l.price_unit,
         la.url AS thumbnail_url,
         COALESCE(vc.views, 0) AS views_last_30_days,
         COALESCE(bc.bookings, 0) AS bookings_last_30_days
       FROM listings l
       LEFT JOIN listing_assets la ON la.listing_id = l.id AND la.is_primary = TRUE
       LEFT JOIN (
         SELECT listing_id, COUNT(*) AS views
         FROM listing_view_events
         WHERE viewed_at > NOW() - INTERVAL '30 days'
         GROUP BY listing_id
       ) vc ON vc.listing_id = l.id
       LEFT JOIN (
         SELECT listing_id, COUNT(*) AS bookings
         FROM bookings
         WHERE created_at > NOW() - INTERVAL '30 days'
         GROUP BY listing_id
       ) bc ON bc.listing_id = l.id
       WHERE l.vendor_id = $1 AND l.deleted_at IS NULL
       ORDER BY l.created_at DESC`,
      [userId]
    );
    return res.rows;
  },


  /**
   * Creates a minimal draft listing. 
   * Called immediately when the wizard opens to establish a UUID for image uploads.
   */
  async createDraft(userId: number, kind: 'hall' | 'service'): Promise<{ id: string }> {
    const db = getDB();
    const res = await db.query(
      `INSERT INTO listings (vendor_id, kind, status, base_price_kobo) 
       VALUES ($1, $2, 'draft', 0) RETURNING id`,
      [userId, kind]
    );
    return res.rows[0];
  },

  /**
   * Debounced autosave target. Merges the JSONB payload without overwriting status.
   */
  async updateDraft(listingId: string, userId: number, payload: any): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE listings SET draft_payload = $3, updated_at = NOW() 
       WHERE id = $1 AND vendor_id = $2 AND status = 'draft'`,
      [listingId, userId, JSON.stringify(payload)]
    );
  },

  /**
   * Flips status to pending_review. The frontend schema is trusted here only if 
   * the backend re-validates it (handled in controller).
   */
  async publishDraft(listingId: string, userId: number): Promise<void> {
    const db = getDB();
    await db.query(
      `UPDATE listings SET status = 'pending_review', updated_at = NOW() 
       WHERE id = $1 AND vendor_id = $2`,
      [listingId, userId]
    );
  },

  /**
   * Generates a secure, short-lived signature for Cloudinary direct uploads.
   * Validates listing ownership before issuing.
   */
  async signCloudinaryUpload(listingId: string, userId: number) {
    const db = getDB();
    const owns = await db.query(
      `SELECT 1 FROM listings WHERE id = $1 AND vendor_id = $2`,
      [listingId, userId]
    );
    if (owns.rowCount === 0) throw new Error('Forbidden: You do not own this listing.');

    if (!ENV.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary is not configured.');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `eventvnv/listings/${listingId}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      ENV.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      folder,
      apiKey: ENV.CLOUDINARY_API_KEY,
      cloudName: ENV.CLOUDINARY_CLOUD_NAME,
    };
  }
};
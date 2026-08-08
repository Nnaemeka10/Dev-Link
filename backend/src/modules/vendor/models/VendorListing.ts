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
      `INSERT INTO listings (vendor_id, kind, status, base_price_kobo, title) 
       VALUES ($1, $2, 'draft', 0, 'Untitled Draft') RETURNING id`,
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
  async publishDraft(listingId: string, userId: number, payload?:any): Promise<void> {
    const db = getDB();
    if (payload) {
        await this.processDraftPayload(listingId, payload);
    }
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
  },


  /**
 * Processes the draft_payload JSONB and writes structured data to
 * relational tables (hall types, location, capacity, features, etc.).
 * Called by publishDraft — keeps the DB "smart" while the draft stays flexible.
 */
async processDraftPayload(listingId: string, payload: any): Promise<void> {
    const db = getDB();
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Update listing core fields from draft
        const details = payload.details;
        const category = payload.category;
        const pricing = payload.pricing;

        if (category === 'hall' && details?.hallLocation) {
            const stateName = await this._resolveStateName(client, details.hallLocation.stateId);
            const lgaName = await this._resolveLgaName(client, details.hallLocation.lgaId);

            await client.query(
                `UPDATE listings SET
                    title = COALESCE($2, title),
                    headline = COALESCE($3, headline),
                    description = COALESCE($4, description),
                    address_line = $5,
                    city = $6,
                    state = $7,
                    capacity = $8,
                    base_price_kobo = $9,
                    price_unit = COALESCE($10, price_unit),
                    updated_at = NOW()
                 WHERE id = $1`,
                [
                    listingId,
                    details.name || null,
                    details.name ? `${details.name} — Premium Event Venue` : null, // auto-headline
                    details.description || null,
                    details.hallLocation.streetAddress || null,
                    lgaName,
                    stateName,
                    this._extractCapacityFromAmenities(payload.amenities),
                    pricing?.basePrice ? Math.round(pricing.basePrice) : 0,
                    'per event',
                ]
            );
        } else if (category === 'service' && details?.serviceLocation) {
            await client.query(
                `UPDATE listings SET
                    title = COALESCE($2, title),
                    headline = COALESCE($3, headline),
                    description = COALESCE($4, description),
                    address_line = $5,
                    base_price_kobo = $6,
                    price_unit = COALESCE($7, price_unit),
                    service_metadata = $8,
                    updated_at = NOW()
                 WHERE id = $1`,
                [
                    listingId,
                    details.name || null,
                    details.name || null,
                    details.description || null,
                    details.serviceLocation.businessAddress || null,
                    pricing?.basePrice ? Math.round(pricing.basePrice) : 0,
                    'per event',
                    JSON.stringify({
                        requirements: this._buildRequirementsArray(payload),
                        response_time: null,
                    }),
                ]
            );
        }

        // 2. Insert hall types (halls and services)
        if (details?.selectedTypeIds?.length) {
            // Clear existing, then insert fresh
            await client.query(`DELETE FROM listing_hall_types WHERE listing_id = $1`, [listingId]);

            const values = details.selectedTypeIds
                .map((_: string, i: number) => `($1, $${i + 2})`)
                .join(', ');

            if (values) {
                await client.query(
                    `INSERT INTO listing_hall_types (listing_id, type_id) VALUES ${values}
                     ON CONFLICT DO NOTHING`,
                    [listingId, ...details.selectedTypeIds]
                );
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
  },

   async _resolveStateName(client: any, stateId: string | null): Promise<string | null> {
      if (!stateId) return null;
      const res = await client.query(`SELECT name FROM nigeria_states WHERE id = $1`, [stateId]);
      return res.rows[0]?.name ?? null;
  },

  async _resolveLgaName(client: any, lgaId: string | null): Promise<string | null> {
      if (!lgaId) return null;
      const res = await client.query(`SELECT name FROM nigeria_lgas WHERE id = $1`, [lgaId]);
      return res.rows[0]?.name ?? null;
  },

  _extractCapacityFromAmenities(amenities: any[]): number | null {
      const capacityAmenity = amenities?.find((a) => a.amenityId === 'capacity');
      if (!capacityAmenity?.value) return null;
      const parsed = parseInt(capacityAmenity.value, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  },

  _buildRequirementsArray(payload: any): string[] {
      const reqs: string[] = [];
      if (payload.requirements) {
          reqs.push(...payload.requirements.map((r: any) => `${r.value}`));
      }
      if (payload.customRequirements) {
          reqs.push(...payload.customRequirements.map((r: any) => r.text));
      }
      return reqs;
  },
};


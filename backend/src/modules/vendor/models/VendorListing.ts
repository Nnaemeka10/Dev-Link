import { getDB } from '../../../lib/db.js';
import type { PoolClient } from 'pg';
import cloudinary from '../../../lib/cloudinary.js';
import { ENV } from '../../../lib/env.js';

/**
 * Mirror of the wizard's HALL_AMENITY_DEFINITIONS.
 * `icon` is the stable key that BOTH of these read:
 *   ListingFeatures.tsx picks the Lucide icon on the details page
 *   Listing.ts AMENITY_ICONS matches the explore amenity filter
 * Every amenity MUST have a distinct icon. Two ids sharing one icon make them
 * indistinguishable to the filter (selecting either matches both).
 * Keep this map, AMENITY_ICONS and FEATURE_ICONS in lockstep.
 */
const HALL_AMENITY_META: Record<string, { label: string; icon: string; unit?: string }> = {
  'capacity':           { label: 'Capacity',           icon: 'capacity', unit: 'guests' },
  'parking':            { label: 'Parking',            icon: 'parking',  unit: 'spaces' },
  'wifi':               { label: 'High-Speed WiFi',    icon: 'wifi' },
  'climate-control':    { label: 'Central AC',         icon: 'climate' },
  'backup-generator':   { label: 'Backup Generator',   icon: 'power' },
  'security-247':       { label: '24/7 Security',      icon: 'security-247' },
  'sound-system':       { label: 'Pro Sound System',   icon: 'sound-system' },
  'elevated-stage':     { label: 'Elevated Stage',     icon: 'elevated-stage' },
  'custom-lighting':    { label: 'Custom Lighting',    icon: 'custom-lighting' },
  'led-screens':        { label: 'LED Screens',        icon: 'led-screens' },
  'bridal-suite':       { label: 'Bridal Suite',       icon: 'suite' },
  'premium-restrooms':  { label: 'Premium Restrooms',  icon: 'premium-restrooms' },
  'furniture-included': { label: 'Furniture Included', icon: 'furniture-included' },
  'prep-kitchen':       { label: 'Prep Kitchen',       icon: 'prep-kitchen' },
  'in-house-catering':  { label: 'In-House Catering',  icon: 'in-house-catering' },
};

/** Auto-badge policy: which wizard selections earn which badge_dictionary name. */
const AMENITY_BADGE_RULES: Record<string, string> = {
  'sound-system':      'Premium Sound System',
  'led-screens':       'AV Equipment Included',
  'custom-lighting':   'AV Equipment Included',
  'elevated-stage':    'AV Equipment Included',
  'parking':           'Free Parking',
  'in-house-catering': 'Catering Included',
  'bridal-suite':      'Luxury Venue',
};

const HALL_TYPE_BADGE_RULES: Record<string, string> = {
  'outdoor-garden': 'Outdoor Space',
};

/**
 * Lifecycle guards - one source of truth for every write path.
 *
 * EDITABLE  : the owner may open the wizard and autosave.
 * LIVE      : currently serving in search. Autosave writes ONLY draft_payload;
 *             the relational columns are the approved version and must not
 *             move until the staged payload is applied.
 * OFFLINE   : draft / rejected / archived - nothing is serving, so a publish
 *             may project the payload straight onto the row.
 */
const EDITABLE_STATUSES = ['draft', 'rejected', 'published', 'pending_review', 'archived'];
const LIVE_STATUSES = ['published', 'pending_review'];

/** Bookings that still owe the customer an event - they block hard deletion. */
const ACTIVE_BOOKING_STATUSES = `('paid', 'funds_held', 'confirmed', 'completed', 'processing_payout')`;

export const VendorListingModel = {
  /** Listings owned by this vendor + lightweight 30-day engagement stats. */
  async getListingsByVendor(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT l.id, l.title, CONCAT_WS(', ', l.city, l.state) AS location, l.status,
              l.base_price_kobo, l.price_unit, l.pending_review_at,
              (l.draft_payload IS NOT NULL) AS has_draft,
              la.url AS thumbnail_url,
              COALESCE(vc.views, 0) AS views_last_30_days,
              COALESCE(bc.bookings, 0) AS bookings_last_30_days,
              COALESCE(ub.upcoming, 0) AS upcoming_bookings
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
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS upcoming
         FROM bookings b
         WHERE b.listing_id = l.id
           AND b.status IN ${ACTIVE_BOOKING_STATUSES}
           AND b.end_date >= CURRENT_DATE
       ) ub ON TRUE
       WHERE l.vendor_id = $1 AND l.deleted_at IS NULL
       ORDER BY l.created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  /**
   * Single listing + saved wizard payload, for reopening in the wizard.
   * Ownership and soft-delete are enforced here; the controller decides
   * whether the status is editable.
   */
  async getDraftById(listingId: string, userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT id, kind, status, draft_payload, pending_review_at
       FROM listings
       WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL`,
      [listingId, userId]
    );
    return res.rows[0] || null;
  },

  /** Minimal draft, created when the wizard opens so uploads have a UUID. */
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
   * Debounced autosave target. Never overwrites status.
   *
   * On a LIVE (or unlisted) listing this writes ONLY draft_payload. The old
   * behaviour projected title and base_price_kobo onto the row on every
   * keystroke - harmless for a draft, but on a published listing it pushed
   * unreviewed edits straight into search results and the booking price.
   */
  async updateDraft(listingId: string, userId: number, payload: any): Promise<void> {
    const db = getDB();
    const owner = await db.query(
      `SELECT status FROM listings
       WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL`,
      [listingId, userId]
    );
    const status = owner.rows[0]?.status;
    if (!status || !EDITABLE_STATUSES.includes(status)) {
      throw new Error('NOT_EDITABLE');
    }

    if (LIVE_STATUSES.includes(status) || status === 'archived') {
      await db.query(
        `UPDATE listings SET draft_payload = $3, updated_at = NOW()
         WHERE id = $1 AND vendor_id = $2`,
        [listingId, userId, JSON.stringify(payload)]
      );
      return;
    }

    const name = String(payload?.details?.name ?? '').trim();
    const priceKobo = Number.isFinite(payload?.pricing?.basePrice)
      ? Math.round(payload.pricing.basePrice) // already kobo - do NOT ×100 again
      : null;

    await db.query(
      `UPDATE listings
       SET draft_payload = $3,
           title = COALESCE(NULLIF($4, ''), title),
           base_price_kobo = COALESCE($5, base_price_kobo),
           updated_at = NOW()
       WHERE id = $1 AND vendor_id = $2 AND status IN ('draft', 'rejected')`,
      [listingId, userId, JSON.stringify(payload), name, priceKobo]
    );
  },

  /**
   * Publish / republish / relist - one guarded, atomic path.
   *
   * OFFLINE listing (draft, rejected, archived):
   *   project the payload onto the row, then set status by ENABLE_LISTING_REVIEW.
   *
   * LIVE listing (published, pending_review):
   *   review OFF → apply the payload immediately, stay published, zero downtime.
   *   review ON  → live columns untouched; the payload is staged and
   *                pending_review_at is stamped for the moderation queue.
   *
   * The row lock plus the single transaction mean a double-click can never
   * half-apply a payload, and the projection + status flip commit together.
   *
   * BIND-PARAMETER RULE: a parameter may appear in only ONE type context.
   * `status = $3` deduces listing_status while `$3 = 'pending_review'` deduces
   * text, and Postgres rejects the pair (42P08 inconsistent types). Hence one
   * explicitly-cast parameter per column: $3::listing_status, $4::boolean.
   */
  async publishDraft(
    listingId: string,
    userId: number,
    payload?: any
  ): Promise<{ status: string; staged: boolean }> {
    const db = getDB();
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `SELECT id, status, draft_payload FROM listings
         WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL
         FOR UPDATE`,
        [listingId, userId]
      );
      const row = rows[0];
      if (!row || !EDITABLE_STATUSES.includes(row.status)) {
        throw new Error('NOT_EDITABLE');
      }

      const reviewEnabled = ENV.ENABLE_LISTING_REVIEW;
      const isLive = LIVE_STATUSES.includes(row.status);

      // Staged edit: the approved version keeps serving.
      if (isLive && reviewEnabled) {
        if (payload) {
          await client.query(
            `UPDATE listings
             SET draft_payload = $2::jsonb, pending_review_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [listingId, JSON.stringify(payload)]
          );
        } else {
          await client.query(
            `UPDATE listings SET pending_review_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [listingId]
          );
        }
        await client.query('COMMIT');
        return { status: row.status, staged: true };
      }

      const effectivePayload = payload ?? row.draft_payload;
      if (effectivePayload) {
        await this.processDraftPayload(listingId, effectivePayload, client);
      }

      const nextStatus = reviewEnabled ? 'pending_review' : 'published';
      const updated = await client.query(
        `UPDATE listings
         SET status = $3::listing_status,
             pending_review_at = CASE WHEN $4::boolean THEN NOW() ELSE NULL END,
             updated_at = NOW()
         WHERE id = $1 AND vendor_id = $2
         RETURNING status`,
        [listingId, userId, nextStatus, reviewEnabled]
      );

      await client.query('COMMIT');
      return { status: updated.rows[0].status, staged: false };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Take a live listing out of search without destroying anything.
   * Existing bookings are honoured and the row stays in My Listings so the
   * vendor can relist it. This is the safe alternative to deletion when
   * events are still owed.
   */
  async unlistListing(listingId: string, userId: number): Promise<boolean> {
    const db = getDB();
    const res = await db.query(
      `UPDATE listings SET status = 'archived', updated_at = NOW()
       WHERE id = $1 AND vendor_id = $2
         AND status IN ('published', 'pending_review')
         AND deleted_at IS NULL
       RETURNING id`,
      [listingId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  /** Bring an unlisted listing back. Applies any staged payload, same as publish. */
  async relistListing(
    listingId: string,
    userId: number
  ): Promise<{ status: string; staged: boolean }> {
    const db = getDB();
    const { rows } = await db.query(
      `SELECT status FROM listings
       WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL`,
      [listingId, userId]
    );
    if (!rows[0]) throw new Error('NOT_FOUND');
    if (rows[0].status !== 'archived') throw new Error('NOT_ARCHIVED');
    return this.publishDraft(listingId, userId);
  },

  /**
   * Soft delete, refused while the listing still owes someone an event.
   * The row (and therefore every booking, review and ledger reference) is
   * preserved; status='archived' + deleted_at guarantees no write path can
   * resurrect it and public search never sees it again.
   */
  async deleteListing(listingId: string, userId: number): Promise<boolean> {
    const db = getDB();
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `SELECT id FROM listings
         WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL
         FOR UPDATE`,
        [listingId, userId]
      );
      if (!rows[0]) throw new Error('NOT_FOUND');

      const upcoming = await client.query(
        `SELECT COUNT(*)::int AS n FROM bookings
         WHERE listing_id = $1
           AND status IN ${ACTIVE_BOOKING_STATUSES}
           AND end_date >= CURRENT_DATE`,
        [listingId]
      );
      if ((upcoming.rows[0]?.n ?? 0) > 0) throw new Error('ACTIVE_BOOKINGS');

      await client.query(
        `UPDATE listings SET deleted_at = NOW(), status = 'archived', updated_at = NOW()
         WHERE id = $1`,
        [listingId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  /** Short-lived Cloudinary signature. Ownership validated before issuing. */
  async signCloudinaryUpload(listingId: string, userId: number) {
    const db = getDB();
    const owns = await db.query(
      `SELECT 1 FROM listings WHERE id = $1 AND vendor_id = $2`,
      [listingId, userId]
    );
    if (owns.rowCount === 0) throw new Error('Forbidden: You do not own this listing.');
    if (!ENV.CLOUDINARY_API_SECRET) throw new Error('Cloudinary is not configured.');

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `eventvnv/listings/${listingId}`;
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, ENV.CLOUDINARY_API_SECRET);

    return {
      signature,
      timestamp,
      folder,
      apiKey: ENV.CLOUDINARY_API_KEY,
      cloudName: ENV.CLOUDINARY_CLOUD_NAME,
    };
  },

  /**
   * Projects draft_payload JSONB into the relational tables the search filters
   * read. Every column written here has a matching predicate in
   * listings/models/Listing.ts, keep the two in lockstep.
   *
   * Accepts an existing client so publishDraft can wrap the projection and the
   * status flip in ONE transaction. Called standalone it owns its transaction.
   */
  async processDraftPayload(
    listingId: string,
    payload: any,
    existingClient?: PoolClient
  ): Promise<void> {
    const db = getDB();
    const client = existingClient ?? (await db.connect());
    const ownsTransaction = !existingClient;

    try {
      if (ownsTransaction) await client.query('BEGIN');

      const details = payload.details;
      const category = payload.category;
      const pricing = payload.pricing;

      // 0. Keep `kind` in lockstep with the wizard category and search filters on it.
      await client.query(
        `UPDATE listings SET kind = $2::listing_kind, updated_at = NOW()
         WHERE id = $1 AND kind IS DISTINCT FROM $2::listing_kind`,
        [listingId, category]
      );

      // 1. Core columns per category + clear the OTHER category's stale columns.
      if (category === 'hall' && details?.hallLocation) {
        const stateName = await this._resolveStateName(client, details.hallLocation.stateId);
        const lgaName = await this._resolveLgaName(client, details.hallLocation.lgaId);
        await client.query(
          `UPDATE listings
           SET title = COALESCE($2, title),
               headline = COALESCE($3, headline),
               description = COALESCE($4, description),
               address_line = $5, city = $6, state = $7, capacity = $8,
               base_price_kobo = $9, price_unit = COALESCE($10, price_unit),
               service_metadata = NULL, updated_at = NOW()
           WHERE id = $1`,
          [
            listingId,
            details.name || null,
            details.name ? `${details.name} - Premium Event Venue` : null,
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
          `UPDATE listings
           SET title = COALESCE($2, title),
               headline = COALESCE($3, headline),
               description = COALESCE($4, description),
               address_line = $5, base_price_kobo = $6,
               price_unit = COALESCE($7, price_unit),
               service_metadata = $8, capacity = NULL, city = NULL, state = NULL,
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

      // 2. Hall/service types. Writes the wizard's stable ids, exactly what the
      //    venueTypes / role filters match on.
      if (details?.selectedTypeIds?.length) {
        await client.query(`DELETE FROM listing_hall_types WHERE listing_id = $1`, [listingId]);
        const values = details.selectedTypeIds
          .map((_: string, i: number) => `($1, $${i + 2})`)
          .join(', ');
        if (values) {
          await client.query(
            `INSERT INTO listing_hall_types (listing_id, type_id) VALUES ${values} ON CONFLICT DO NOTHING`,
            [listingId, ...details.selectedTypeIds]
          );
        }
      }

      // 3. Amenities, listing_features.icon (hall-only; services clear stale rows).
      await client.query(`DELETE FROM listing_features WHERE listing_id = $1`, [listingId]);
      if (category === 'hall') {
        const rows = (payload.amenities ?? [])
          .map((a: any) => {
            const meta = HALL_AMENITY_META[a.amenityId];
            const value = String(a.value ?? '').trim();
            if (!meta || !value) return null;
            return { icon: meta.icon, label: meta.label, value: meta.unit ? `${value} ${meta.unit}` : value };
          })
          .filter(Boolean);

        if (rows.length > 0) {
          const values = rows.map((_: any, i: number) => {
            const b = i * 4;
            return `($1, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`;
          });
          const params: any[] = [listingId];
          rows.forEach((r: any, i: number) => params.push(r.icon, r.label, r.value, i));
          await client.query(
            `INSERT INTO listing_features (listing_id, icon, label, value, sort_order)
             VALUES ${values.join(', ')}`,
            params
          );
        }
      }

      // 4. Auto-badges derived from amenities + hall types.
      await client.query(`DELETE FROM listing_badges WHERE listing_id = $1`, [listingId]);
      if (category === 'hall') {
        const names = new Set<string>();
        for (const a of payload.amenities ?? []) {
          const badge = AMENITY_BADGE_RULES[a.amenityId];
          if (badge) names.add(badge);
        }
        for (const typeId of details?.selectedTypeIds ?? []) {
          const badge = HALL_TYPE_BADGE_RULES[typeId];
          if (badge) names.add(badge);
        }
        if (names.size > 0) {
          await client.query(
            `INSERT INTO listing_badges (listing_id, badge_id)
             SELECT $1, id FROM badge_dictionary WHERE name = ANY($2::text[])
             ON CONFLICT DO NOTHING`,
            [listingId, [...names]]
          );
        }
      }

      // 5. Service packages. price arrives already in kobo from the client.
      await client.query(`DELETE FROM service_packages WHERE listing_id = $1`, [listingId]);
      let hasPackages = false;
      if (category === 'service' && pricing?.packages?.length) {
        hasPackages = true;
        for (let i = 0; i < pricing.packages.length; i++) {
          const pkg = pricing.packages[i];
          const res = await client.query(
            `INSERT INTO service_packages (listing_id, name, price_kobo, description, is_popular, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [listingId, pkg.name, Math.round(pkg.price), pkg.description ?? null, !!pkg.isPopular, i]
          );
          const packageId = res.rows[0].id;
          const perks = (pkg.perks ?? []).filter((p: any) => p?.label?.trim());
          if (perks.length > 0) {
            const perkValues = perks.map((_: any, j: number) => `($1, $${j * 2 + 2}, $${j * 2 + 3})`);
            const perkParams: any[] = [packageId];
            perks.forEach((p: any, j: number) => perkParams.push(p.label, j));
            await client.query(
              `INSERT INTO package_features (package_id, text, sort_order) VALUES ${perkValues.join(', ')}`,
              perkParams
            );
          }
        }
      }

      // 5a. Cached "from" price. pricingStepSchema allows basePrice: null when
      //     usesPackages is true, which would leave base_price_kobo = 0 - making
      //     the listing match EVERY price filter and sort as the cheapest result.
      //     Derive it from the cheapest package, inside the same transaction.
      if (category === 'service' && hasPackages) {
        await client.query(
          `UPDATE listings
           SET base_price_kobo = COALESCE(
                 (SELECT MIN(price_kobo) FROM service_packages WHERE listing_id = $1), 0
               ),
               updated_at = NOW()
           WHERE id = $1`,
          [listingId]
        );
      }

      // 5b. Service coverage areas - listing_service_areas (coverage filter).
      await client.query(`DELETE FROM listing_service_areas WHERE listing_id = $1`, [listingId]);
      if (category === 'service' && details?.serviceLocation) {
        const sl = details.serviceLocation;
        for (const stateId of sl.coverageStateIds ?? []) {
          const stateName = await this._resolveStateName(client, stateId);
          if (!stateName) continue;
          if (sl.coverageMode === 'statewide') {
            await client.query(
              `INSERT INTO listing_service_areas (listing_id, city, state, country)
               VALUES ($1, $2, $2, 'Nigeria')`,
              [listingId, stateName]
            );
          } else {
            const deselected = sl.deselectedLgaIdsByState?.[stateId] ?? [];
            await client.query(
              `INSERT INTO listing_service_areas (listing_id, city, state, country)
               SELECT $1, l.name, $2, 'Nigeria'
               FROM nigeria_lgas l
               WHERE l.state_id = $3 AND NOT (l.id = ANY($4::text[]))`,
              [listingId, stateName, stateId, deselected]
            );
          }
        }
      }

      // 6. Blocked dates. Only vendor_blocked rows are replaced, so booking-driven
      //    'booked' rows survive a republish.
      await client.query(
        `DELETE FROM listing_unavailable_dates WHERE listing_id = $1 AND reason = 'vendor_blocked'`,
        [listingId]
      );
      const blocked = pricing?.availability?.blockedDates ?? [];
      if (blocked.length > 0) {
        const dateValues = blocked.map((_: string, i: number) => {
          const b = i * 3;
          return `($1, $${b + 2}::date, $${b + 3}::date, $${b + 4})`;
        });
        const dateParams: any[] = [listingId];
        blocked.forEach((d: string) => dateParams.push(d, d, 'vendor_blocked'));
        await client.query(
          `INSERT INTO listing_unavailable_dates (listing_id, start_date, end_date, reason)
           VALUES ${dateValues.join(', ')}`,
          dateParams
        );
      }

      // 7. Gallery.
      const photos = (payload.gallery ?? []).filter(
        (p: any) => p.uploadStatus === 'uploaded' && p.url
      );
      if (photos.length > 0) {
        await client.query(`DELETE FROM listing_assets WHERE listing_id = $1`, [listingId]);
        const coverIdx = Math.max(0, photos.findIndex((p: any) => p.isCover));
        const values: string[] = [];
        const params: any[] = [listingId];
        photos.forEach((p: any, i: number) => {
          const b = i * 4;
          values.push(`($1, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`);
          params.push(p.publicId ?? p.url, p.url, i === coverIdx, i);
        });
        await client.query(
          `INSERT INTO listing_assets (listing_id, cloudinary_public_id, url, is_primary, sort_order)
           VALUES ${values.join(', ')}`,
          params
        );
      }

      if (ownsTransaction) await client.query('COMMIT');
    } catch (error) {
      if (ownsTransaction) await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      if (ownsTransaction) client.release();
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
    const parsed = parseInt(String(capacityAmenity.value).replace(/[^\d]/g, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  },

  _buildRequirementsArray(payload: any): string[] {
    const reqs: string[] = [];
    if (payload.requirements) reqs.push(...payload.requirements.map((r: any) => `${r.value}`));
    if (payload.customRequirements) reqs.push(...payload.customRequirements.map((r: any) => r.text));
    return reqs;
  },
};
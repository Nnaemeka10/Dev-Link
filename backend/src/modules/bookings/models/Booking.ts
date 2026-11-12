import { getDB } from '../../../lib/db.js';
import type { PoolClient } from 'pg';
import type { BookingDetailsResponse, BookingRow, CreateBookingInput } from '../types/booking.js';

function generateBookingReference(): string {
    return `EVV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

/**
 * Hold lifecycle (heartbeat lease model):
 *  • expires_at is a SHORT ROLLING LEASE. The popup pings /heartbeat every
 *    30s to renew it. If the browser crashes / tab dies / network drops,
 *    the lease lapses within 2 minutes and the 30s cron releases the hold.
 *  • The HARD session cap is created_at + 30 minutes. Leases are always
 *    capped at it, so a session can never be extended past 30 minutes.
 *    Reusing a live hold keeps created_at (same session clock); a NEW
 *    booking starts a fresh clock.
 */
export const HOLD_LEASE_MINUTES = 2;
export const HOLD_SESSION_MINUTES = 30;

/** Absolute session deadline for a booking row (created_at + hard cap). */
export function getHoldDeadline(createdAt: string | Date): string {
    return new Date(new Date(createdAt).getTime() + HOLD_SESSION_MINUTES * 60 * 1000).toISOString();
}

//
// Stay math - single source of truth for envelope + holes.
// Pricing, idempotency, availability and calendar blocking all derive from
// resolveStay so they can never disagree.
//

interface Stay {
    cleanStart: string;
    cleanEnd: string;
    /** Chargeable days = envelope days - excluded days. */
    days: number;
    /** Validated, deduped, sorted interior exclusions (YYYY-MM-DD). */
    excluded: string[];
    /** Contiguous booked spans - what actually gets blocked on the calendar. */
    subRanges: { from: string; to: string }[];
}

/**
 * pg returns DATE columns as JS Date objects (and DATE[] as Date[]).
 * String(Date) produces "Wed Dec 10 2025 …", NOT an ISO day - so every
 * date-ish input is normalized through this before any string math.
 */
function toDayString(v: string | Date): string {
    if (v instanceof Date) {
        return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    }
    return String(v).split('T')[0];
}

function resolveStay(
    startDate: string | Date,
    endDate: string | Date,
    excludedDates: (string | Date)[] = []
): Stay {
    const cleanStart = toDayString(startDate);
    const cleanEnd = toDayString(endDate);
    const startMs = new Date(cleanStart).getTime();
    const endMs = new Date(cleanEnd).getTime();

    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
        throw new Error('Invalid date selection');
    }

    const envelopeDays = Math.round((endMs - startMs) / 86400000) + 1;

    // Only strictly-interior days can be excluded; endpoints define the envelope.
    const excluded = [...new Set(excludedDates.map(toDayString))]
        .filter((d) => d > cleanStart && d < cleanEnd)
        .sort();

    const days = envelopeDays - excluded.length;
    if (days < 1) throw new Error('Invalid date selection');

    // Contiguous sub-ranges - what actually gets blocked for other customers.
    const ex = new Set(excluded);
    const subRanges: { from: string; to: string }[] = [];
    let segStart: string | null = null;
    for (let t = startMs; t <= endMs; t += 86400000) {
        const k = new Date(t).toISOString().split('T')[0];
        if (ex.has(k)) {
            if (segStart) {
                subRanges.push({ from: segStart, to: new Date(t - 86400000).toISOString().split('T')[0] });
                segStart = null;
            }
        } else if (!segStart) {
            segStart = k;
        }
    }
    if (segStart) subRanges.push({ from: segStart, to: cleanEnd });

    return { cleanStart, cleanEnd, days, excluded, subRanges };
}

/** Block the calendar per contiguous sub-range - excluded days stay open. */
async function blockStayDates(client: PoolClient, listingId: string, stay: Stay): Promise<void> {
    for (const r of stay.subRanges) {
        await client.query(
            `INSERT INTO listing_unavailable_dates (listing_id, start_date, end_date, reason)
             VALUES ($1, $2, $3, 'booked')
             ON CONFLICT DO NOTHING`,
            [listingId, r.from, r.to]
        );
    }
}

//
// Availability SQL - shared by the public check and the locked create path.
//
// A date is taken if it overlaps:
//   • any paid-ish booking (blocks EVERYONE, including its owner), OR
//   • another user's pending booking with a LIVE LEASE (checkout hold).
//
// $1 listingId · $2 endDay · $3 startDay · $4 userId (nullable - self-exclusion)
// $5 excluded days of the REQUESTING selection (holes don't collide).
// Day-aware: generate_series walks only the actual overlap window.
//

const AVAILABILITY_SQL = `
    SELECT 1 FROM bookings b
    WHERE b.listing_id = $1
      AND (
            b.status IN ('paid', 'confirmed', 'funds_held', 'processing_payout', 'payout_released', 'completed')
         OR (b.status = 'pending' AND b.expires_at > NOW()
             AND ($4::bigint IS NULL OR b.user_id <> $4::bigint))
      )
      AND b.start_date <= $2::date AND b.end_date >= $3::date
      AND EXISTS (
            SELECT 1 FROM generate_series(
                GREATEST(b.start_date, $3::date),
                LEAST(b.end_date, $2::date),
                INTERVAL '1 day'
            ) d
            WHERE NOT (d::date = ANY(b.excluded_dates))
              AND NOT (d::date = ANY($5::date[]))
      )
    LIMIT 1`;

/** Paid-only overlap against OTHER bookings - the late-payment safety net. */
const PAID_OVERLAP_SQL = `
    SELECT b.id, b.booking_reference FROM bookings b
    WHERE b.listing_id = $1
      AND b.id <> $2
      AND b.status IN ('paid', 'confirmed', 'funds_held', 'processing_payout', 'payout_released', 'completed')
      AND b.start_date <= $3::date AND b.end_date >= $4::date
      AND EXISTS (
            SELECT 1 FROM generate_series(
                GREATEST(b.start_date, $4::date),
                LEAST(b.end_date, $3::date),
                INTERVAL '1 day'
            ) d
            WHERE NOT (d::date = ANY(b.excluded_dates))
              AND NOT (d::date = ANY($5::date[]))
      )
    LIMIT 1`;

/**
 * Late-payment safety net (lease lapsed, popup stayed open / late DVA inflow).
 * Money is ALWAYS honored - no auto-refund. If the paid booking overlaps an
 * already-paid one, hold the payout and alert support to resolve manually.
 * Call INSIDE the caller's transaction, after the booking is marked paid.
 */
export async function flagDoubleBookingIfNeeded(
    client: PoolClient,
    booking: {
        id: string;
        listing_id: string;
        start_date: string | Date;
        end_date: string | Date;
        excluded_dates?: (string | Date)[] | null;
        booking_reference?: string | null;
    }
): Promise<boolean> {
    const stay = resolveStay(booking.start_date, booking.end_date, booking.excluded_dates ?? []);
    const conflict = await client.query(PAID_OVERLAP_SQL, [
        booking.listing_id, booking.id, stay.cleanEnd, stay.cleanStart, stay.excluded,
    ]);
    if (conflict.rows.length === 0) return false;

    await client.query(`UPDATE bookings SET payout_hold = TRUE WHERE id = $1`, [booking.id]);
    console.error(
        `[DOUBLE_BOOKING] Booking ${booking.id} (${booking.booking_reference ?? 'no ref'}) paid over an ` +
        `already-paid overlap with booking ${conflict.rows[0].id}. Payout held - support must resolve.`
    );
    return true;
}

//
// Model
//

export const BookingModel = {
    /**
     * Exact-match pending lookup (envelope + excluded days must both match).
     * Kept for compatibility; the create path does its own locked lookup.
     */
    async findExistingPending(
        userId: number,
        listingId: string,
        startDate: string,
        endDate: string,
        excludedDates: string[] = []
    ): Promise<BookingRow | null> {
        const db = getDB();
        const stay = resolveStay(startDate, endDate, excludedDates);
        const result = await db.query<BookingRow>(
            `SELECT * FROM bookings
             WHERE user_id = $1 AND listing_id = $2
               AND start_date = $3::date AND end_date = $4::date
               AND excluded_dates = $5::date[]
               AND status = 'pending'
               AND expires_at > NOW()
             LIMIT 1`,
            [userId, listingId, stay.cleanStart, stay.cleanEnd, stay.excluded]
        );
        return result.rows[0] ?? null;
    },

    /**
     * Hold-aware availability. Pass userId to exclude the caller's OWN pending
     * holds (they can always re-select / re-checkout their own dates).
     * Paid bookings block everyone, including their owner.
     */
    async checkAvailability(
        listingId: string,
        startDate: string,
        endDate: string,
        userId?: number,
        excludedDates: string[] = []
    ): Promise<boolean> {
        const db = getDB();
        const stay = resolveStay(startDate, endDate, excludedDates);
        const client = await db.connect();
        try {
            // xact locks need a transaction to actually hold until release.
            await client.query('BEGIN');
            await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [listingId]);
            const result = await client.query(AVAILABILITY_SQL, [
                listingId, stay.cleanEnd, stay.cleanStart, userId ?? null, stay.excluded,
            ]);
            await client.query('COMMIT');
            return result.rows.length === 0;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Renew the short lease when the payment popup (re)opens. Capped at the
     * hard session deadline so initialize can never extend past 30 minutes.
     */
    async refreshHold(bookingId: string): Promise<void> {
        const db = getDB();
        await db.query(
            `UPDATE bookings
             SET expires_at = LEAST(
                    NOW() + ($2 || ' minutes')::interval,
                    created_at + ($3 || ' minutes')::interval
             )
             WHERE id = $1 AND status = 'pending'`,
            [bookingId, String(HOLD_LEASE_MINUTES), String(HOLD_SESSION_MINUTES)]
        );
    },

    /**
     * Heartbeat: the open popup pings this every 30s to keep its lease alive.
     * FENCED - a lapsed lease can NEVER be renewed (expires_at > NOW() in the
     * WHERE), so a sleeping laptop can't resurrect a hold that other customers
     * may already have taken. alive:false means the client must close the
     * popup and prompt the user to start checkout again.
     */
    async heartbeatHold(
        bookingId: string,
        userId: number
    ): Promise<{ alive: boolean; expiresAt?: string; holdDeadline?: string }> {
        const db = getDB();
        const result = await db.query(
            `UPDATE bookings
             SET expires_at = LEAST(
                    NOW() + ($3 || ' minutes')::interval,
                    created_at + ($4 || ' minutes')::interval
             )
             WHERE id = $1 AND user_id = $2
               AND status = 'pending'
               AND payment_status IS DISTINCT FROM 'success'
               AND expires_at > NOW()
               AND created_at + ($4 || ' minutes')::interval > NOW()
             RETURNING expires_at,
                       created_at + ($4 || ' minutes')::interval AS hold_deadline`,
            [bookingId, userId, String(HOLD_LEASE_MINUTES), String(HOLD_SESSION_MINUTES)]
        );
        if (result.rows.length === 0) return { alive: false };
        return {
            alive: true,
            expiresAt: new Date(result.rows[0].expires_at).toISOString(),
            holdDeadline: new Date(result.rows[0].hold_deadline).toISOString(),
        };
    },

    /**
     * Release a checkout hold the instant the user abandons the Paystack popup
     * (cancel / error / navigating back / closing the tab / session timeout).
     * Idempotent and ownership-scoped. NEVER touches a booking whose payment
     * already succeeded - money moved, so it stays on the paid track.
     */
    async releaseHold(bookingId: string, userId: number): Promise<boolean> {
        const db = getDB();
        const result = await db.query(
            `UPDATE bookings SET status = 'expired'
             WHERE id = $1 AND user_id = $2
               AND status = 'pending'
               AND payment_status IS DISTINCT FROM 'success'
             RETURNING id`,
            [bookingId, userId]
        );
        return (result.rowCount ?? 0) > 0;
    },

    /**
     * Everything the PUBLIC CALENDAR must grey out:
     *  • listing_unavailable_dates (vendor blocks + paid booking blocks), and
     *  • live checkout holds from OTHER users, expanded into their booked
     *    sub-ranges so excluded "hole" days stay selectable.
     * viewerUserId (populated when optional auth is present) hides the
     * viewer's own holds from their own calendar view.
     */
    async getCalendarUnavailableRanges(
        listingId: string,
        viewerUserId?: number
    ): Promise<{ from: string; to: string }[]> {
        const db = getDB();
        const [base, holds] = await Promise.all([
            db.query(
                `SELECT DISTINCT start_date, end_date
                 FROM listing_unavailable_dates
                 WHERE listing_id = $1`,
                [listingId]
            ),
            db.query(
                `SELECT start_date, end_date, excluded_dates
                 FROM bookings
                 WHERE listing_id = $1
                   AND status = 'pending'
                   AND expires_at > NOW()
                   AND ($2::bigint IS NULL OR user_id <> $2::bigint)`,
                [listingId, viewerUserId ?? null]
            ),
        ]);

        const ranges = base.rows.map((r: any) => ({
            from: toDayString(r.start_date),
            to: toDayString(r.end_date),
        }));
        for (const h of holds.rows) {
            const stay = resolveStay(h.start_date, h.end_date, h.excluded_dates ?? []);
            ranges.push(...stay.subRanges);
        }
        return ranges;
    },

    /**
     * Create a booking (= start the hold). The availability check and the
     * INSERT live in ONE transaction under the listing advisory lock, so two
     * simultaneous checkouts can never both pass. Lock order is always
     * advisory - row (same as markAsPaid) to avoid deadlocks.
     *
     * Throws Error('DATES_UNAVAILABLE') for the controller to map to 409.
     */
    async createBooking(
        userId: number,
        input: CreateBookingInput
    ): Promise<{ booking: BookingRow; reused: boolean }> {
        const db = getDB();
        const { listingId, startDate, endDate, startTime, endTime, packageId, excludedDates } = input;
        const stay = resolveStay(startDate, endDate, excludedDates ?? []);

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [listingId]);

            // 1. Idempotent reuse: same user, same selection, lease still alive
            //    - renew the lease and return it (retrying Pay is safe).
            //    created_at is untouched, so the 30-minute session clock keeps
            //    running - reuse can never extend a session past the hard cap
            //    (expires_at is always ≤ created_at + 30min, so once the cap
            //    passes, this lookup finds nothing and a NEW booking starts).
            const existing = await client.query<BookingRow>(
                `SELECT * FROM bookings
                 WHERE user_id = $1 AND listing_id = $2
                   AND start_date = $3::date AND end_date = $4::date
                   AND excluded_dates = $5::date[]
                   AND package_id IS NOT DISTINCT FROM $6::uuid
                   AND status = 'pending' AND expires_at > NOW()
                 LIMIT 1`,
                [userId, listingId, stay.cleanStart, stay.cleanEnd, stay.excluded, packageId || null]
            );
            if (existing.rows.length > 0) {
                const refreshed = await client.query<BookingRow>(
                    `UPDATE bookings
                     SET expires_at = LEAST(
                            NOW() + ($2 || ' minutes')::interval,
                            created_at + ($3 || ' minutes')::interval
                     )
                     WHERE id = $1 RETURNING *`,
                    [existing.rows[0].id, String(HOLD_LEASE_MINUTES), String(HOLD_SESSION_MINUTES)]
                );
                await client.query('COMMIT');
                return { booking: refreshed.rows[0], reused: true };
            }

            // 2. Fetch listing to securely calculate price.
            const listingRes = await client.query(
                `SELECT base_price_kobo, kind, vendor_id FROM listings
                 WHERE id = $1 AND status = 'published'`,
                [listingId]
            );
            if (listingRes.rows.length === 0) {
                throw new Error('Listing not found or not available for booking');
            }
            const listing = listingRes.rows[0];

            if (Number(listing.vendor_id) === Number(userId)) {
                throw new Error('You cannot book your own listing');
            }

            let basePriceKobo: number;
            if (listing.kind === 'service' && packageId) {
                const pkgRes = await client.query(
                    'SELECT price_kobo FROM service_packages WHERE id = $1 AND listing_id = $2',
                    [packageId, listingId]
                );
                if (pkgRes.rows.length === 0) throw new Error('Invalid package selected');
                basePriceKobo = parseFloat(pkgRes.rows[0].price_kobo);
            } else {
                basePriceKobo = parseFloat(listing.base_price_kobo);
            }

            // 3. Money math - backend is the source of truth.
            const subtotal = (basePriceKobo * stay.days) / 100;               // Kobo - Naira
            const vat = Math.round((subtotal * 0.075) * 100) / 100;           // 7.5% VAT
            const totalAmount = Math.round((subtotal + vat) * 100) / 100;
            const platformFee = Math.round((totalAmount * 0.175) * 100) / 100; // 17.5% of total
            const currency = 'NGN';
            const bookingReference = generateBookingReference();
            // Initial short lease: covers the create - initialize - popup-open
            // gap. The popup's first heartbeat renews it immediately.
            const expiresAt = new Date(Date.now() + HOLD_LEASE_MINUTES * 60 * 1000).toISOString();

            // 4. Hold-aware availability - own pendings excluded ($4 = userId).
            const conflict = await client.query(AVAILABILITY_SQL, [
                listingId, stay.cleanEnd, stay.cleanStart, userId, stay.excluded,
            ]);
            if (conflict.rows.length > 0) {
                await client.query('ROLLBACK');
                throw new Error('DATES_UNAVAILABLE');
            }

            // 5. Supersede the user's OTHER pending holds on this listing.
            //    One active checkout per user per listing: going back and
            //    changing dates releases the abandoned selection immediately.
            await client.query(
                `UPDATE bookings SET status = 'expired'
                 WHERE user_id = $1 AND listing_id = $2 AND status = 'pending'`,
                [userId, listingId]
            );

            // 6. Create the booking - this row IS the hold.
            //    Dispute window: computed from the same $4 end-date being
            //    inserted; AT TIME ZONE 'UTC' pins the instant regardless of
            //    server/session timezone.
            const result = await client.query<BookingRow>(
                `INSERT INTO bookings (
                    listing_id, user_id, start_date, end_date, status, total_amount,
                    booking_reference, start_time, end_time, expires_at, currency,
                    platform_fee, dispute_window_closes_at, package_id, excluded_dates
                )
                VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11,
                        ($4::date + interval '24 hours') AT TIME ZONE 'UTC', $12, $13::date[])
                RETURNING *`,
                [
                    listingId, userId, stay.cleanStart, stay.cleanEnd, totalAmount,
                    bookingReference, startTime, endTime, expiresAt, currency,
                    platformFee, packageId || null, stay.excluded,
                ]
            );

            await client.query('COMMIT');
            return { booking: result.rows[0], reused: false };
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    },

    async findByPaymentReference(reference: string): Promise<BookingRow | null> {
        const db = getDB();
        const result = await db.query<BookingRow>(
            `SELECT * FROM bookings WHERE payment_reference = $1`,
            [reference]
        );
        return result.rows[0] ?? null;
    },

    async findById(id: string): Promise<BookingDetailsResponse | null> {
        const db = getDB();
        const result = await db.query<BookingDetailsResponse>(
            `SELECT
                b.*,
                l.title as listing_title,
                l.city as listing_city,
                l.state as listing_state,
                l.capacity as listing_capacity,
                l.auto_approve,
                sp.name as package_name,
                (
                    SELECT la.url FROM listing_assets la
                    WHERE la.listing_id = l.id AND la.is_primary = true
                    LIMIT 1
                ) as listing_image,
                u.first_name as vendor_first_name,
                u.last_name as vendor_last_name,
                u.phone as vendor_phone,
                u.email as vendor_email
             FROM bookings b
             JOIN listings l ON b.listing_id = l.id
             JOIN users u ON l.vendor_id = u.id
             LEFT JOIN service_packages sp ON b.package_id = sp.id
             WHERE b.id = $1`,
            [id]
        );
        if (result.rows.length === 0) return null;

        const row = result.rows[0] as any;
        row.listing_location = [row.listing_city, row.listing_state].filter(Boolean).join(', ');
        return row;
    },

    async updatePaymentReference(bookingId: string, reference: string): Promise<void> {
        const db = getDB();
        await db.query(
            `UPDATE bookings SET payment_reference = $1 WHERE id = $2`,
            [reference, bookingId]
        );
    },

    /**
     * Idempotent and safe to call multiple times.
     * Lock order: listing advisory lock FIRST, then the booking row -
     * identical to createBooking, so the two can never deadlock.
     */
    async markAsPaid(paymentReference: string): Promise<BookingRow | null> {
        const db = getDB();
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Peek at the listing id (no row lock yet) so we can take the
            // listing advisory lock before any row locks.
            const peek = await client.query(
                `SELECT listing_id FROM bookings WHERE payment_reference = $1`,
                [paymentReference]
            );
            if (peek.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }
            await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [peek.rows[0].listing_id]);

            const res = await client.query<BookingRow>(
                `SELECT * FROM bookings WHERE payment_reference = $1 FOR UPDATE`,
                [paymentReference]
            );
            const booking = res.rows[0];

            const ALREADY_PAID: readonly string[] = [
                'paid', 'confirmed', 'funds_held',
                'processing_payout', 'payout_released', 'completed', 'refunded',
            ];
            if (ALREADY_PAID.includes(booking.status)) {
                await client.query('ROLLBACK'); // unlock
                return booking;
            }

            // NOTE: an 'expired' booking can still land here (payment settled
            // after the lease lapsed). That is intentional - the money moved,
            // so we honor it and let the conflict net below catch any overlap.
            const listingRes = await client.query(
                'SELECT auto_approve FROM listings WHERE id = $1',
                [booking.listing_id]
            );
            const isApproved = listingRes.rows[0]?.auto_approve ?? false;
            const finalStatus = isApproved ? 'confirmed' : 'paid';

            const updated = await client.query<BookingRow>(
                `UPDATE bookings
                 SET status = $1, payment_status = 'success', paid_at = NOW()
                 WHERE payment_reference = $2
                 RETURNING *`,
                [finalStatus, paymentReference]
            );

            // Safety net for the lapsed-lease edge: never auto-refund, but
            // hold the payout + alert support if this overlaps a paid booking.
            await flagDoubleBookingIfNeeded(client, updated.rows[0]);

            // Block dates per contiguous sub-range - excluded days stay open
            // for other customers; the explore filter needs zero changes.
            const stay = resolveStay(
                updated.rows[0].start_date,
                updated.rows[0].end_date,
                updated.rows[0].excluded_dates ?? []
            );
            await blockStayDates(client, updated.rows[0].listing_id, stay);

            await client.query('COMMIT');

            // Post-commit side effects: the booking is paid at this point.
            // A chat failure must NEVER turn verifyPayment into a 500.
            try {
                const bookingDetails = await db.query(
                    `SELECT b.id, b.user_id, l.vendor_id, l.title as listing_title,
                     (SELECT la.url FROM listing_assets la
                      WHERE la.listing_id = l.id AND la.is_primary = true LIMIT 1) as listing_image
                     FROM bookings b JOIN listings l ON b.listing_id = l.id WHERE b.id = $1`,
                    [updated.rows[0].id]
                );
                if (bookingDetails.rows.length > 0) {
                    const d = bookingDetails.rows[0];
                    const { ChatModel } = await import('../../chat/models/Chat.js');
                    await ChatModel.createBookingSystemMessage(
                        d.id, d.user_id, d.vendor_id, d.listing_image, d.listing_title
                    );
                }
            } catch (chatError) {
                console.error(`Booking ${updated.rows[0].id} paid, but system message failed:`, chatError);
            }

            return updated.rows[0];
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    },

    async markAsFailed(paymentReference: string): Promise<void> {
        const db = getDB();
        await db.query(
            `UPDATE bookings SET status = 'failed', payment_status = 'failed'
             WHERE payment_reference = $1 AND status = 'pending'`,
            [paymentReference]
        );
        // Failed payments release the hold immediately (status leaves 'pending').
    },

    /**
     * Vendor confirms a PAID booking. Ownership and status guards run inside
     * the transaction so two vendors (or a double-click) can't race it.
     */
    async confirmVendorBooking(bookingId: string, vendorUserId: number): Promise<BookingRow | null> {
        const db = getDB();
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const res = await client.query(
                `SELECT b.*, l.vendor_id
                   FROM bookings b
                   JOIN listings l ON l.id = b.listing_id
                  WHERE b.id = $1
                  FOR UPDATE OF b`,
                [bookingId]
            );
            const row = res.rows[0] as (BookingRow & { vendor_id: number }) | undefined;
            if (!row) {
                await client.query('ROLLBACK');
                return null;
            }
            // pg returns BIGINT as string - compare numerically.
            if (Number(row.vendor_id) !== Number(vendorUserId)) {
                await client.query('ROLLBACK');
                throw new Error('FORBIDDEN');
            }
            if (row.status !== 'paid' && row.status !== 'funds_held') {
                await client.query('ROLLBACK');
                throw new Error(`INVALID_STATUS: Booking cannot be confirmed (current status: ${row.status})`);
            }

            const updated = await client.query<BookingRow>(
                `UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *`,
                [bookingId]
            );

            // Covers the DVA/funds_held path, which doesn't go through
            // markAsPaid. Per sub-range, so excluded days remain bookable.
            const stay = resolveStay(row.start_date, row.end_date, row.excluded_dates ?? []);
            await blockStayDates(client, row.listing_id, stay);

            await client.query('COMMIT');
            return updated.rows[0];
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    },

    async getQuote(
        listingId: string,
        startDate: string,
        endDate: string,
        packageId?: string,
        excludedDates?: string[]
    ): Promise<{ days: number; subtotal: number; vat: number; total: number; currency: string }> {
        const db = getDB();
        const stay = resolveStay(startDate, endDate, excludedDates ?? []);

        const listingRes = await db.query(
            `SELECT base_price_kobo, kind FROM listings WHERE id = $1 AND status = 'published'`,
            [listingId]
        );
        if (listingRes.rows.length === 0) throw new Error('Listing not found');
        const listing = listingRes.rows[0];

        let basePriceKobo: number;
        if (listing.kind === 'service' && packageId) {
            const pkgRes = await db.query(
                'SELECT price_kobo FROM service_packages WHERE id = $1 AND listing_id = $2',
                [packageId, listingId]
            );
            if (pkgRes.rows.length === 0) throw new Error('Invalid package selected');
            basePriceKobo = parseFloat(pkgRes.rows[0].price_kobo);
        } else {
            basePriceKobo = parseFloat(listing.base_price_kobo);
        }

        const subtotal = (basePriceKobo * stay.days) / 100;
        const vat = Math.round((subtotal * 0.075) * 100) / 100;
        const total = Math.round((subtotal + vat) * 100) / 100;

        return { days: stay.days, subtotal, vat, total, currency: 'NGN' };
    },

    /**
     * Release stale holds. Scheduled every 30s by bookingCleanup.job.
     * NOTE: correctness does NOT depend on this cron - checkAvailability
     * filters expires_at > NOW(), so a hold is logically dead the instant
     * its lease lapses. This just keeps stored statuses honest for dashboards.
     * Returns the number of holds expired (for logging).
     */
    async expireStaleBookings(): Promise<number> {
        const db = getDB();
        const result = await db.query(
            `UPDATE bookings SET status = 'expired'
             WHERE status = 'pending' AND expires_at < NOW()
             RETURNING id`
        );
        return result.rowCount ?? 0;
    },
};
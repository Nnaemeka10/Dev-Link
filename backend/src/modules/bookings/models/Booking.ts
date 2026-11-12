import { getDB } from '../../../lib/db.js';
import type { PoolClient } from 'pg';
import type { BookingDetailsResponse, BookingRow, CreateBookingInput } from '../types/booking.js';

function generateBookingReference(): string {
    return `EVV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// 
// Stay resolution - single source of truth for multi-range bookings.
// start_date/end_date are the ENVELOPE; excluded_dates are strictly-interior
// days the customer removed. Everything (pricing, idempotency, availability,
// calendar blocking) derives from this one helper so they can never disagree.
// 
interface Stay {
    cleanStart: string;
    cleanEnd: string;
    /** Chargeable days = envelope days - excluded days. */
    days: number;
    /** Validated, deduped, sorted interior exclusions. */
    excluded: string[];
    /** Contiguous booked spans - what actually gets blocked on the calendar. */
    subRanges: { from: string; to: string }[];
}

function resolveStay(startDate: string, endDate: string, excludedDates: string[] = []): Stay {
    const cleanStart = String(startDate).split('T')[0];
    const cleanEnd = String(endDate).split('T')[0];
    const startMs = new Date(cleanStart).getTime();
    const endMs = new Date(cleanEnd).getTime();

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
        throw new Error('Invalid date selection');
    }

    const envelopeDays = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);

    // Only strictly-interior, well-formed days can be excluded - the endpoints
    // define the envelope. Sorting makes array equality usable for idempotency.
    const excluded = [...new Set((excludedDates ?? []).map((d) => String(d).split('T')[0]))]
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d > cleanStart && d < cleanEnd)
        .sort();

    const days = envelopeDays - excluded.length;
    if (days < 1) throw new Error('Invalid date selection');

    // Contiguous sub-ranges. 'YYYY-MM-DD' parses as UTC midnight, so plain
    // 86_400_000 ms arithmetic is calendar-safe (no DST drift).
    const ex = new Set(excluded);
    const iso = (t: number) => new Date(t).toISOString().split('T')[0];
    const subRanges: { from: string; to: string }[] = [];
    let segStart: string | null = null;

    for (let t = startMs; t <= endMs; t += 86400000) {
        const k = iso(t);
        if (ex.has(k)) {
            if (segStart) {
                subRanges.push({ from: segStart, to: iso(t - 86400000) });
                segStart = null;
            }
        } else if (!segStart) {
            segStart = k;
        }
    }
    if (segStart) subRanges.push({ from: segStart, to: cleanEnd });

    return { cleanStart, cleanEnd, days, excluded, subRanges };
}

/** Block each contiguous sub-range so excluded days stay bookable by others. */
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

export const BookingModel = {
    // Find existing pending booking for this user/dates/selection, or return null.
    // excluded_dates participates in the match: same envelope with different
    // holes is a DIFFERENT booking, not an idempotent retry.
    async findExistingPending(
        userId: number,
        listingId: string,
        startDate: string,
        endDate: string,
        excludedDates: string[] = []
    ): Promise<BookingRow | null> {
        const db = getDB();
        const stay = resolveStay(startDate, endDate, excludedDates);
        // Ignore expired pending bookings!
        const result = await db.query<BookingRow>(
            `SELECT * FROM bookings
             WHERE user_id = $1 AND listing_id = $2
             AND start_date = $3 AND end_date = $4
             AND excluded_dates = $5::date[]
             AND status = 'pending'
             AND (expires_at IS NULL OR expires_at > NOW())
             LIMIT 1`,
            [userId, listingId, stay.cleanStart, stay.cleanEnd, stay.excluded]
        );
        return result.rows[0] ?? null;
    },

    // Day-aware overlap check. A day conflicts only when it is BOTH booked by
    // an existing paid booking (not excluded there) AND requested by the new
    // booking (not excluded here). Advisory lock serializes checks per listing.
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

            const query = `
                SELECT 1 FROM bookings b
                WHERE b.listing_id = $1
                AND b.status IN ('paid', 'confirmed', 'funds_held', 'processing_payout', 'payout_released', 'completed')
                AND b.start_date <= $2 AND b.end_date >= $3
                AND EXISTS (
                    SELECT 1 FROM generate_series(
                        GREATEST(b.start_date, $3::date),
                        LEAST(b.end_date, $2::date),
                        '1 day'::interval
                    ) d
                    WHERE NOT (d::date = ANY(b.excluded_dates))
                      AND NOT (d::date = ANY($4::date[]))
                )
            `;
            const result = await client.query(query, [listingId, stay.cleanEnd, stay.cleanStart, stay.excluded]);

            await client.query('COMMIT');
            return result.rows.length === 0;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async createBooking(userId: number, input: CreateBookingInput): Promise<BookingRow> {
        const db = getDB();
        const { listingId, startDate, endDate, startTime, endTime, packageId, excludedDates } = input;
        const stay = resolveStay(startDate, endDate, excludedDates);

        // 1. Fetch listing to securely calculate price
        const listingRes = await db.query(
            `SELECT base_price_kobo, kind, vendor_id FROM listings WHERE id = $1 AND status = 'published'`,
            [listingId]
        );

        if (listingRes.rows.length === 0) {
            throw new Error('Listing not found or not available for booking');
        }

        const listing = listingRes.rows[0];

        // pg returns BIGINT as string - compare numerically.
        if (Number(listing.vendor_id) === Number(userId)) {
            throw new Error('You cannot book your own listing');
        }

        let basePriceKobo = 0;
        if (listing.kind === 'service' && packageId) {
            const pkgRes = await db.query('SELECT price_kobo FROM service_packages WHERE id = $1 AND listing_id = $2', [packageId, listingId]);
            if (pkgRes.rows.length === 0) throw new Error('Invalid package selected');
            basePriceKobo = parseFloat(pkgRes.rows[0].price_kobo);
        } else {
            basePriceKobo = parseFloat(listing.base_price_kobo);
        }

        // Chargeable days come from resolveStay - excluded days are never billed.
        const subtotalKobo = basePriceKobo * stay.days;

        // 2. Calculate Amount in NAIRA (Backend is source of truth)
        const subtotal = subtotalKobo / 100; // Convert Kobo to Naira
        const vat = Math.round((subtotal * 0.075) * 100) / 100; // 7.5% VAT
        const totalAmount = Math.round((subtotal + vat) * 100) / 100;

        // Platform fee is 17.5% of total fee paid (base price + vat)
        const platformFee = Math.round((totalAmount * 0.175) * 100) / 100;

        const currency = 'NGN'; // Hardcoded for Paystack NGN flow
        const bookingReference = generateBookingReference();

        // 3. Calculate Escrow Deadlines
        // Payment deadline: 30 minutes from now
        const paymentDeadline = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const expiresAt = paymentDeadline; // remove this later and use paymentDeadline instead
        // Dispute window: 24 hours after the event ends.
        // Computed inside the INSERT from the same end-date value ($4) being
        // inserted - date + interval is pure calendar arithmetic and
        // AT TIME ZONE 'UTC' pins the instant (dispute_window_closes_at is TIMESTAMPTZ).

        // 4. Create the booking record
        const result = await db.query<BookingRow>(
            `INSERT INTO bookings (
                listing_id, user_id, start_date, end_date, status, total_amount,
                booking_reference, start_time, end_time, expires_at, currency, platform_fee,
                dispute_window_closes_at, package_id, excluded_dates
            )
            VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11,
                    ($4::date + interval '24 hours') AT TIME ZONE 'UTC', $12, $13::date[])
            RETURNING *`,
            [
                listingId,
                userId,
                stay.cleanStart,
                stay.cleanEnd,
                totalAmount,
                bookingReference,
                startTime,
                endTime,
                expiresAt,
                currency,
                platformFee,
                packageId || null,
                stay.excluded,
            ]
        );

        return result.rows[0];
    },

    // Allow finding by payment reference for the verify endpoint
    async findByPaymentReference(reference: string): Promise<BookingRow | null> {
        const db = getDB();
        const result = await db.query<BookingRow>(`SELECT * FROM bookings WHERE payment_reference = $1`, [reference]);
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

        // Combine city and state for location
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

    // Idempotent and Safe to call multiple times
    async markAsPaid(paymentReference: string): Promise<BookingRow | null> {
        const db = getDB();

        // Use a transaction to ensure atomicity
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Lock the row for update to prevent race conditions
            const res = await client.query<BookingRow>(
                `SELECT * FROM bookings WHERE payment_reference = $1 FOR UPDATE`,
                [paymentReference]
            );

            if (res.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            const booking = res.rows[0];

            const ALREADY_PAID: readonly string[] = [
                'paid', 'confirmed', 'funds_held',
                'processing_payout', 'payout_released', 'completed', 'refunded'
            ];

            // Idempotency check: If already paid, just return it
            if (ALREADY_PAID.includes(booking.status)) {
                await client.query('ROLLBACK'); // Unlock row
                return booking;
            }

            const listingRes = await client.query('SELECT auto_approve FROM listings WHERE id = $1', [booking.listing_id]);
            const isApproved = listingRes.rows[0]?.auto_approve ?? false;
            const finalStatus = isApproved ? 'confirmed' : 'paid';

            // Update booking to paid
            const updated = await client.query<BookingRow>(
                `UPDATE bookings
                 SET status = $1, payment_status = 'success', paid_at = NOW()
                 WHERE payment_reference = $2
                 RETURNING *`,
                [finalStatus, paymentReference]
            );

            // Block dates per contiguous sub-range - excluded days stay open
            // for other customers, and the explore date filter (which reads
            // listing_unavailable_dates) needs zero changes.
            const stay = resolveStay(
                updated.rows[0].start_date,
                updated.rows[0].end_date,
                updated.rows[0].excluded_dates ?? []
            );
            await blockStayDates(client, updated.rows[0].listing_id, stay);

            await client.query('COMMIT');

            // Post-commit side effects 
            // The booking is paid at this point. A chat failure must NEVER
            // bubble up and turn verifyPayment into a 500 - the money moved.
            try {
                const bookingDetails = await db.query(
                    `SELECT b.id, b.user_id, l.vendor_id, l.title as listing_title,
                    (SELECT la.url FROM listing_assets la WHERE la.listing_id = l.id AND la.is_primary = true LIMIT 1) as listing_image
                    FROM bookings b JOIN listings l ON b.listing_id = l.id WHERE b.id = $1`,
                    [updated.rows[0].id]
                );

                if (bookingDetails.rows.length > 0) {
                    const d = bookingDetails.rows[0];
                    // Dynamically import ChatModel to avoid circular dependency issues
                    const { ChatModel } = await import('../../chat/models/Chat.js');
                    await ChatModel.createBookingSystemMessage(d.id, d.user_id, d.vendor_id, d.listing_image, d.listing_title);
                }
            } catch (chatError) {
                console.error(`Booking ${updated.rows[0].id} paid, but system message failed:`, chatError);
            }

            return updated.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
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
        // make this do a refund later
    },

    /**
     * Vendor confirms a PAID booking. Ownership and status guards run inside
     * the transaction so two vendors (or a double-click) can't race it.
     * Throws Error('FORBIDDEN') / Error('INVALID_STATUS: ...') for the
     * controller to map to HTTP codes. Returns null if booking not found.
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

            // Ensure the calendar blocks exist - covers the DVA/funds_held
            // payment path, which doesn't go through markAsPaid. Per sub-range,
            // so excluded days remain bookable.
            const stay = resolveStay(row.start_date, row.end_date, row.excluded_dates ?? []);
            await blockStayDates(client, row.listing_id, stay);

            await client.query('COMMIT');
            return updated.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
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
        const stay = resolveStay(startDate, endDate, excludedDates);

        // 1. Fetch listing base price
        const listingRes = await db.query(
            `SELECT base_price_kobo, kind FROM listings WHERE id = $1 AND status = 'published'`,
            [listingId]
        );
        if (listingRes.rows.length === 0) throw new Error('Listing not found');
        const listing = listingRes.rows[0];

        let basePriceKobo = 0;
        if (listing.kind === 'service' && packageId) {
            const pkgRes = await db.query('SELECT price_kobo FROM service_packages WHERE id = $1 AND listing_id = $2', [packageId, listingId]);
            if (pkgRes.rows.length === 0) throw new Error('Invalid package selected');
            basePriceKobo = parseFloat(pkgRes.rows[0].price_kobo);
        } else {
            basePriceKobo = parseFloat(listing.base_price_kobo);
        }

        // Same day math as createBooking - quote and charge can never diverge.
        const subtotalKobo = basePriceKobo * stay.days;

        // 2. Calculate securely on backend, convert Kobo - Naira BEFORE returning
        const subtotal = subtotalKobo / 100;
        const vat = Math.round((subtotal * 0.075) * 100) / 100; // 7.5% VAT
        const total = Math.round((subtotal + vat) * 100) / 100;

        return { days: stay.days, subtotal, vat, total, currency: 'NGN' };
    },

    // Utility to expire stale bookings (Call this via a cron job every 5 mins)
    async expireStaleBookings(): Promise<void> {
        const db = getDB();
        await db.query(
            `UPDATE bookings SET status = 'expired'
             WHERE status = 'pending' AND expires_at < NOW()`
        );
    }
};
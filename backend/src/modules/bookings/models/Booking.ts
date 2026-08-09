import { getDB } from '../../../lib/db.js';
import type { BookingDetailsResponse, BookingRow, CreateBookingInput } from '../types/booking.js';


function generateBookingReference(): string {
    return `EVV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export const BookingModel = {
    // Find existing pending booking for this user/dates, or return null
    async findExistingPending(userId: number, listingId: string, startDate: string, endDate: string): Promise<BookingRow | null> {
        const db = getDB();
        // Ignore expired pending bookings!
        const result = await db.query<BookingRow>(
            `SELECT * FROM bookings 
             WHERE user_id = $1 AND listing_id = $2 
             AND start_date = $3 AND end_date = $4
             AND status = 'pending' 
             AND (expires_at IS NULL OR expires_at > NOW())
             LIMIT 1`,
            [userId, listingId, startDate.split('T')[0], endDate.split('T')[0]]
        );
        return result.rows[0] ?? null;
    },

    //Exclude expired pendings, and use Advisory Locks to prevent race conditions
    async checkAvailability(listingId: string, startDate: string, endDate: string, userId?: number): Promise<boolean> {
        const db = getDB();
        const client = await db.connect();
        try {
            // 1. Lock these exact dates for this listing at the DB level for a few milliseconds
            // This prevents User B from inserting while User A is inserting
            await client.query(`SELECT pg_advisory_xact_lock(hashtext($1 || $2 || $3))`, [listingId, startDate, endDate]);

            const query = `
                SELECT 1 FROM bookings 
                WHERE listing_id = $1 
                AND status IN ('pending', 'confirmed', 'paid')
                AND (status != 'pending' OR expires_at > NOW()) -- Ignore expired pending
                AND (start_date <= $2 AND end_date >= $3)
            `;
            
            const params: any[] = [listingId, endDate, startDate];

            const result = await client.query(query, params);
            client.release();
            return result.rows.length === 0;
        } catch (error) {
            client.release();
            throw error;
        }
    },


    async createBooking(userId: number, input: CreateBookingInput): Promise<BookingRow> {
        const db = getDB();
        const { listingId, startDate, endDate, startTime, endTime, packageId } = input;
        // const guestCount = Number.isFinite(Number(guests)) ? Math.max(1, Math.floor(Number(guests))) : 1;
        const cleanStart = startDate.split('T')[0];
        const cleanEnd = endDate.split('T')[0];

        // 1. Fetch listing to securely calculate price
        const listingRes = await db.query(
            `SELECT base_price_kobo FROM listings WHERE id = $1 AND status = 'published'`,
            [listingId]
        );
        
        if (listingRes.rows.length === 0) {
            throw new Error('Listing not found or not available for booking');
        }

        const listing = listingRes.rows[0];

         let subtotalKobo = 0;
         let days = 1;

         if (listing.kind === 'service' && packageId) {
            const pkgRes = await db.query('SELECT price_kobo FROM service_packages WHERE id = $1 AND listing_id = $2', [packageId, listingId]);
            if (pkgRes.rows.length === 0) throw new Error('Invalid package selected');
            const basePriceKobo = parseFloat(pkgRes.rows[0].price_kobo);
            const startMs = new Date(cleanStart).getTime();
            const endMs = new Date(cleanEnd).getTime();
            days = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
            subtotalKobo = basePriceKobo * days;
        } else {
            const basePriceKobo = parseFloat(listing.base_price_kobo);
            const startMs = new Date(cleanStart).getTime();
            const endMs = new Date(cleanEnd).getTime();
            days = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
            subtotalKobo = basePriceKobo * days;
        }

        // 2. Calculate Amount in NAIRA (Backend is source of truth)
        const subtotal = subtotalKobo / 100; // Convert Kobo to Naira
        const vat = Math.round((subtotal * 0.075) * 100) / 100; // 7.5% VAT
        const totalAmount = Math.round((subtotal + vat) * 100) / 100;

         // Platform fee is 17.5% of total fee paid (base price + vat)
        const platformFee = Math.round((totalAmount * 0.175) * 100) / 100; 

        const currency = 'NGN'; // Hardcoded for Paystack NGN flow, or use listing.currency

        const bookingReference = generateBookingReference();


        // // Set expires_at to 15 minutes from now
        // const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();


        // 3. Calculate Escrow Deadlines
        // Payment deadline: 30 minutes from now
        const paymentDeadline = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const expiresAt = paymentDeadline; // remove this later and use paymentDeadline instead
        // Dispute window: 24 hours after the event ends
        const disputeWindowClosesAt = new Date(new Date(cleanEnd).getTime() + 24 * 60 * 60 * 1000).toISOString();

        // 4. Create the booking record
        const result = await db.query<BookingRow>(
            `INSERT INTO bookings (
                listing_id, user_id, start_date, end_date, status, total_amount, 
                booking_reference, start_time, end_time, expires_at, currency, platform_fee, dispute_window_closes_at, package_id
            ) 
            VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`,
            [
                listingId, 
                userId, 
                cleanStart, 
                cleanEnd,
                totalAmount,
                bookingReference,
                startTime,
                endTime,
                expiresAt, //remove this later and use paymentDeadline instead
                // paymentDeadline,
                currency,
                // guestCount,
                platformFee,
                disputeWindowClosesAt,
                packageId || null
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

            // Idempotency check: If already paid, just return it
            if (booking.status === 'paid' || booking.status === 'confirmed') {
                await client.query('ROLLBACK'); // Unlock row
                return booking;
            }

            const listingRes = await client.query('SELECT auto_approve FROM listings WHERE id = $1', [booking.listing_id]);
            const isAutoApproved = listingRes.rows[0]?.auto_approve ?? false;
            const finalStatus = isAutoApproved ? 'confirmed' : 'pending'; // 'pending' means awaiting vendor approval

            // Update booking to paid
            const updated = await client.query<BookingRow>(
                `UPDATE bookings 
                 SET status = $1, payment_status = 'success', paid_at = NOW() 
                 WHERE payment_reference = $2 
                 RETURNING *`,
                [finalStatus, paymentReference]
            );

            // Add to listing_unavailability to block dates
            await client.query(
                `INSERT INTO listing_unavailable_dates (listing_id, start_date, end_date, reason) 
                 VALUES ($1, $2, $3, 'booked') 
                 ON CONFLICT DO NOTHING`,
                [updated.rows[0].listing_id, updated.rows[0].start_date, updated.rows[0].end_date]
            );

            await client.query('COMMIT');
            // Fetch details needed for the system message
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

        //make this do a refund later
    },

    async getQuote(listingId: string, startDate: string, endDate: string, packageId?: string): Promise<{ days: number; subtotal: number; vat: number; total: number; currency: string }> {
        const db = getDB();
        
        // 1. Fetch listing base price
        const listingRes = await db.query(
            `SELECT base_price_kobo FROM listings WHERE id = $1 AND status = 'published'`,
            [listingId]
        );
        
        if (listingRes.rows.length === 0) {
            throw new Error('Listing not found');
        }

        const listing = listingRes.rows[0];
        const cleanStart = startDate.split('T')[0];
        const cleanEnd = endDate.split('T')[0];

        let subtotalKobo = 0; 
        let days = 1;

        if (listing.kind === 'service' && packageId) {
            const pkgRes = await db.query('SELECT price_kobo FROM service_packages WHERE id = $1 AND listing_id = $2', [packageId, listingId]);
            if (pkgRes.rows.length === 0) throw new Error('Invalid package selected');
            const basePriceKobo = parseFloat(pkgRes.rows[0].price_kobo);
            const startMs = new Date(cleanStart).getTime();
            const endMs = new Date(cleanEnd).getTime();
            days = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
            subtotalKobo = basePriceKobo * days;
        } else {
            const basePriceKobo = parseFloat(listing.base_price_kobo);
            const startMs = new Date(cleanStart).getTime();
            const endMs = new Date(cleanEnd).getTime();
            days = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
            subtotalKobo = basePriceKobo * days;
        }


        // 3. Calculate securely on backend and Convert Kobo to Naira BEFORE returning to frontend
        const subtotal = subtotalKobo / 100; 
        const vat = Math.round((subtotal * 0.075) * 100) / 100; // 7.5% VAT
        const total = Math.round((subtotal + vat) * 100) / 100;

        return { days, subtotal, vat, total, currency: 'NGN' };
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

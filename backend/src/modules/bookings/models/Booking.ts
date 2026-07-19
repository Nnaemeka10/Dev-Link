import { getDB } from '../../../lib/db.js';
import type { BookingRow, CreateBookingInput } from '../types/booking.js';

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
            
            // Exclude the current user's own pending booking so they don't block themselves
            if (userId) {
                const userQuery = query.replace('WHERE listing_id', 'WHERE user_id <> $4 AND listing_id');
                params.push(userId);
                const result = await client.query(userQuery, params);
                client.release();
                return result.rows.length === 0;
            }

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
        const { listingId, startDate, endDate, startTime, endTime, guests } = input;
        const cleanStart = startDate.split('T')[0];
        const cleanEnd = endDate.split('T')[0];

        // 1. Fetch listing to securely calculate price
        const listingRes = await db.query(
            `SELECT base_price FROM listings WHERE id = $1 AND status = 'published'`,
            [listingId]
        );
        
        if (listingRes.rows.length === 0) {
            throw new Error('Listing not found or not available for booking');
        }

        const listing = listingRes.rows[0];

        const basePrice = parseFloat(listing.base_price);
        // Inclusive day calculation (Friday to Sunday = 3 days)
        const startMs = new Date(cleanStart).getTime();
        const endMs = new Date(cleanEnd).getTime();
        const days = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
        
        // 2. Calculate Amount (Backend is source of truth)
        const totalAmount = basePrice * days;
        const currency = 'NGN'; // Hardcoded for Paystack NGN flow, or use listing.currency

        const bookingReference = generateBookingReference();
        // Set expires_at to 15 minutes from now
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        // 3. Create the booking record
        const result = await db.query<BookingRow>(
            `INSERT INTO bookings (
                listing_id, user_id, start_date, end_date, status, total_amount, 
                booking_reference, start_time, end_time, expires_at, currency
            ) 
            VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10) 
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
                expiresAt,
                currency
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

    async findById(id: string): Promise<BookingRow | null> {
        const db = getDB();
        const result = await db.query<BookingRow>(`SELECT * FROM bookings WHERE id = $1`, [id]);
        return result.rows[0] ?? null;
    },

    async updatePaymentReference(bookingId: string, reference: string): Promise<void> {
        const db = getDB();
        await db.query(
            `UPDATE bookings SET payment_reference = $1 WHERE id = $2`,
            [reference, bookingId]
        );
    },
 
    // Idempotent: Safe to call multiple times
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

            // Update booking to paid
            const updated = await client.query<BookingRow>(
                `UPDATE bookings 
                 SET status = 'paid', payment_status = 'success', paid_at = NOW() 
                 WHERE payment_reference = $1 
                 RETURNING *`,
                [paymentReference]
            );

            // Optional: Add to listing_unavailability to block dates
            await client.query(
                `INSERT INTO listing_unavailable_dates (listing_id, start_date, end_date, reason) 
                 VALUES ($1, $2, $3, 'booked') 
                 ON CONFLICT DO NOTHING`,
                [updated.rows[0].listing_id, updated.rows[0].start_date, updated.rows[0].end_date]
            );

            await client.query('COMMIT');
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

    // Utility to expire stale bookings (Call this via a cron job every 5 mins)
    async expireStaleBookings(): Promise<void> {
        const db = getDB();
        await db.query(
            `UPDATE bookings SET status = 'expired' 
             WHERE status = 'pending' AND expires_at < NOW()`
        );
    }
};
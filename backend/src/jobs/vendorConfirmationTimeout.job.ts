import { getDB } from '../lib/db.js';
import { RefundModel } from '../modules/payments/models/RefundModel.js';
import { bookingEmailService } from '../emails/bookingEmails.js';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const TIMEOUT_HOURS = 24;

/**
 * Auto-cancels + fully refunds paid bookings the vendor never confirmed
 * within 24h of payment. Skips auto_approve listings (those confirm on
 * payment). Emails both parties. Idempotent: executeRefund no-ops on
 * already-terminal bookings, and the query excludes active refunds.
 */
export function startVendorConfirmationTimeoutJob(): void {
    const tick = async () => {
        const db = getDB();
        try {
            const { rows } = await db.query(
                `SELECT b.id, b.booking_reference, b.total_amount,
                        l.title AS listing_title,
                        cu.email AS customer_email, cu.first_name AS customer_name,
                        vu.email AS vendor_email, vu.first_name AS vendor_name
                 FROM bookings b
                 JOIN listings l ON l.id = b.listing_id
                 JOIN users cu ON cu.id = b.user_id
                 JOIN users vu ON vu.id = l.vendor_id
                 WHERE b.status IN ('paid', 'funds_held')
                   AND l.auto_approve = false
                   AND b.paid_at IS NOT NULL
                   AND b.paid_at + ($1 || ' hours')::interval < NOW()
                   AND NOT EXISTS (
                        SELECT 1 FROM refunds r
                        WHERE r.booking_id = b.id AND r.status IN ('processing', 'completed')
                   )
                 LIMIT 50`,
                [String(TIMEOUT_HOURS)]
            );

            for (const b of rows) {
                try {
                    await RefundModel.executeRefund(b.id, {
                        source: 'vendor_timeout',
                        reason: 'vendor_unresponsive',
                        description: 'Vendor did not confirm within 24 hours of payment.',
                    });
                    const amount = parseFloat(b.total_amount);
                    await bookingEmailService.sendAutoCancelledToCustomer(
                        b.customer_email, b.customer_name, b.listing_title, b.booking_reference, amount
                    );
                    await bookingEmailService.sendAutoCancelledToVendor(
                        b.vendor_email, b.vendor_name, b.listing_title, b.booking_reference
                    );
                    console.log(`[vendor-timeout] Auto-cancelled + refunded booking ${b.booking_reference}`);
                } catch (error) {
                    console.error(`[vendor-timeout] Failed for booking ${b.id}:`, error);
                }
            }
        } catch (error) {
            console.error('[vendor-timeout] Sweep failed:', error);
        }
    };

    void tick();
    setInterval(() => void tick(), INTERVAL_MS);
}
import { BookingModel } from '../modules/bookings/models/Booking.js';

// 30s sweep: with 2-minute heartbeat leases, a crashed browser's hold is
// released within ~2.5 minutes (lease lapse + one sweep), not 30 minutes.
const INTERVAL_MS = 30_000;

/**
 * Expires stale checkout holds. Correctness never depends on this timing:
 * checkAvailability filters `expires_at > NOW()`, so holds release logically
 * the instant their lease lapses. This job keeps stored statuses honest and
 * is the guaranteed release path for browser crashes / dropped beacons.
 */
export function startBookingCleanupJob(): void {
    const tick = async () => {
        try {
            const expired = await BookingModel.expireStaleBookings();
            if (expired > 0) {
                console.log(`[booking-cleanup] Released ${expired} stale checkout hold(s)`);
            }
        } catch (error) {
            console.error('[booking-cleanup] Failed to expire stale bookings:', error);
        }
    };

    void tick(); // sweep once at boot (covers holds that died during a restart)
    setInterval(() => void tick(), INTERVAL_MS);
}
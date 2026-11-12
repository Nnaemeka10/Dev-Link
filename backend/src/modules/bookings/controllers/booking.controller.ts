import { Request, Response } from 'express';
import { BookingModel, getHoldDeadline } from '../models/Booking.js';
import type { CreateBookingInput } from '../types/booking.js';

/** Shared guard: excludedDates must be an array of strings when present. */
function isValidExcludedDates(value: unknown): boolean {
    return value === undefined ||
        (Array.isArray(value) && value.every((d) => typeof d === 'string'));
}

export const createBooking = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const {
            listingId, startDate, endDate, startTime, endTime,
            preferences, packageId, excludedDates,
        } = req.body as CreateBookingInput;

        if (!listingId || !startDate || !endDate || !startTime || !endTime) {
            res.status(400).json({ message: 'Missing required booking fields' });
            return;
        }
        if (!isValidExcludedDates(excludedDates)) {
            res.status(400).json({ message: 'excludedDates must be an array of date strings' });
            return;
        }

        // The model handles EVERYTHING inside one advisory-locked transaction:
        // idempotent reuse (+ lease renewal), hold-aware availability (own
        // holds excluded), superseding abandoned holds, and the insert.
        const { booking, reused } = await BookingModel.createBooking(req.user.userId, {
            listingId, startDate, endDate, startTime, endTime,
            preferences, packageId, excludedDates,
        });

        res.status(reused ? 200 : 201).json({
            bookingId: booking.id,
            amount: parseFloat(booking.total_amount.toString()),
            currency: booking.currency,
            status: booking.status,
            expiresAt: booking.expires_at,          // short lease (heartbeat-renewed)
            holdDeadline: getHoldDeadline(booking.created_at), // hard 30-min cap - countdown + auto-close
        });
    } catch (error: any) {
        console.error('Create booking error:', error);
        const message: string = error?.message ?? '';

        if (message === 'DATES_UNAVAILABLE') {
            res.status(409).json({
                message: 'These dates are no longer available - another customer may be checking out. Please pick different dates.',
            });
            return;
        }
        if (
            message === 'You cannot book your own listing' ||
            message === 'Invalid package selected' ||
            message === 'Invalid date selection'
        ) {
            res.status(400).json({ message });
            return;
        }
        if (message === 'Listing not found or not available for booking') {
            res.status(404).json({ message });
            return;
        }

        // Unexpected errors: log details, never leak them to the client.
        res.status(500).json({ message: 'Failed to create booking' });
    }
};

/**
 * POST /api/bookings/:id/heartbeat
 * The open Paystack popup pings this every 30s to renew its 2-minute lease.
 * Always 200 with an `alive` flag so the client can distinguish "session is
 * dead" (close popup, prompt to retry) from a network error (retry, then
 * close after repeated failures). alive:false when the booking is no longer
 * pending, the lease already lapsed (fenced - never resurrected), or the
 * 30-minute hard cap has passed.
 */
export const heartbeatBookingHold = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const result = await BookingModel.heartbeatHold(req.params.id, Number(req.user.userId));
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json(result);
    } catch (error: any) {
        console.error('Heartbeat booking hold error:', error);
        res.status(500).json({ message: 'Failed to renew booking hold' });
    }
};

/**
 * POST /api/bookings/:id/release-hold
 * Abandoning the Paystack popup releases the hold immediately. Always 200 -
 * releasing an already-expired/paid booking is a safe no-op, and the SQL
 * ownership guard means someone else's booking id can't be released.
 */
export const releaseBookingHold = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const released = await BookingModel.releaseHold(req.params.id, Number(req.user.userId));
        res.status(200).json({ released });
    } catch (error: any) {
        console.error('Release booking hold error:', error);
        res.status(500).json({ message: 'Failed to release booking hold' });
    }
};

export const getBookingDetails = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const booking = await BookingModel.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }

        // Security: ensure user owns this booking (Number() - pg BIGINT is a string).
        if (Number(booking.user_id) !== Number(req.user.userId)) {
            res.status(403).json({ message: 'Forbidden: You do not own this booking' });
            return;
        }

        res.status(200).json(booking);
    } catch (error: any) {
        console.error('Get booking error:', error);
        res.status(500).json({ message: 'Failed to fetch booking' });
    }
};

export const getBookingQuote = async (req: Request, res: Response) => {
    try {
        const { listingId, startDate, endDate, packageId, excludedDates } = req.body;

        if (!listingId || !startDate || !endDate) {
            res.status(400).json({ message: 'Listing ID, start date, and end date are required' });
            return;
        }
        if (!isValidExcludedDates(excludedDates)) {
            res.status(400).json({ message: 'excludedDates must be an array of date strings' });
            return;
        }

        const quote = await BookingModel.getQuote(listingId, startDate, endDate, packageId, excludedDates);
        res.status(200).json(quote);
    } catch (error: any) {
        console.error('Get quote error:', error);
        const message: string = error?.message ?? '';

        if (message === 'Invalid package selected' || message === 'Invalid date selection') {
            res.status(400).json({ message });
            return;
        }
        if (message === 'Listing not found') {
            res.status(404).json({ message });
            return;
        }
        res.status(500).json({ message: 'Failed to get quote' });
    }
};
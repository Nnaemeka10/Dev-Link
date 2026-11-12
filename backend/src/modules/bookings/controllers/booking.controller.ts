import { Request, Response } from 'express';
import { BookingModel } from '../models/Booking.js';
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

        const { listingId, startDate, endDate, startTime, endTime, preferences, packageId, excludedDates } =
            req.body as CreateBookingInput;

        if (!listingId || !startDate || !endDate || !startTime || !endTime) {
            res.status(400).json({ message: 'Missing required booking fields' });
            return;
        }

        if (!isValidExcludedDates(excludedDates)) {
            res.status(400).json({ message: 'excludedDates must be an array of date strings (YYYY-MM-DD)' });
            return;
        }

        // 1. Idempotency - reuse existing pending booking if the user retries
        //    the SAME selection (envelope + excluded days must both match).
        const existingBooking = await BookingModel.findExistingPending(
            req.user.userId, listingId, startDate, endDate, excludedDates
        );
        if (existingBooking) {
            return res.status(200).json({
                bookingId: existingBooking.id,
                amount: parseFloat(existingBooking.total_amount.toString()),
                currency: existingBooking.currency,
                status: existingBooking.status
            });
        }

        // 2. Day-aware availability check (excluded days don't conflict)
        const isAvailable = await BookingModel.checkAvailability(
            listingId, startDate, endDate, req.user.userId, excludedDates
        );
        if (!isAvailable) {
            res.status(409).json({ message: 'Selected dates are no longer available' });
            return;
        }

        // 3. Create Booking (price calculated securely in model)
        const booking = await BookingModel.createBooking(req.user.userId, {
            listingId, startDate, endDate, excludedDates, startTime, endTime, preferences, packageId
        });

        res.status(201).json({
            bookingId: booking.id,
            amount: parseFloat(booking.total_amount.toString()),
            currency: booking.currency,
            status: booking.status
        });

    } catch (error: any) {
        console.error('Create booking error:', error);

        const message: string = error?.message ?? '';

        // Known client errors - 4xx
        if (
            message === 'You cannot book your own listing' ||
            message === 'Invalid package selected' ||
            message === 'Invalid date selection'
        ) {
            return res.status(400).json({ message });
        }
        if (message === 'Listing not found or not available for booking') {
            return res.status(404).json({ message });
        }

        // Unexpected errors: log the details, but don't leak them to the client.
        return res.status(500).json({ message: 'Failed to create booking' });
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

        // Security: ensure user owns this booking.
        // pg returns BIGINT as string - compare numerically.
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
            res.status(400).json({ message: 'excludedDates must be an array of date strings (YYYY-MM-DD)' });
            return;
        }

        const quote = await BookingModel.getQuote(listingId, startDate, endDate, packageId, excludedDates);
        res.status(200).json(quote);
    } catch (error: any) {
        console.error('Get quote error:', error);

        const message: string = error?.message ?? '';

        if (message === 'Invalid package selected' || message === 'Invalid date selection') {
            return res.status(400).json({ message });
        }
        if (message === 'Listing not found') {
            return res.status(404).json({ message });
        }

        return res.status(500).json({ message: 'Failed to get quote' });
    }
};
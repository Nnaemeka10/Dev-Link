import { Request, Response } from 'express';
import { BookingModel } from '../models/Booking.js';
import type { CreateBookingInput } from '../types/booking.js';
import { getDB } from '../../../lib/db.js';
import { provisionDvaForBooking } from '../../payments/controllers/payment.controller.js';

export const createBooking = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const { listingId, startDate, endDate, startTime, endTime, preferences } = req.body as CreateBookingInput;

        if (!listingId || !startDate || !endDate || !startTime || !endTime) {
            res.status(400).json({ message: 'Missing required booking fields' });
            return;
        }

        // 1: Idempotency - Reuse existing pending booking if user retries
        const existingBooking = await BookingModel.findExistingPending(req.user.userId, listingId, startDate, endDate);
        if (existingBooking) {
            return res.status(200).json({
                bookingId: existingBooking.id,
                amount: parseFloat(existingBooking.total_amount.toString()),
                currency: existingBooking.currency,
                status: existingBooking.status
            });
        }

        // 2. Check Availability (excluding the users own pending)
        const isAvailable = await BookingModel.checkAvailability(listingId, startDate, endDate, req.user.userId);
        if (!isAvailable) {
            res.status(409).json({ message: 'Selected dates are no longer available' });
            return;
        }

        // 3. Create Booking (Price calculated securely in model)
        const booking = await BookingModel.createBooking(req.user.userId, {
            listingId, startDate, endDate, startTime, endTime, preferences
        });

        //add  this when i add dva 
         //INTEGRATION HOOK: Provision DVA for this specific booking
        // We do this asynchronously so the user gets their booking confirmation instantly.
        const uid = req.user.userId;
        // setImmediate(async () => {
        //     try {
        //     const db = getDB();
        //     const userRes = await db.query('SELECT email, paystack_customer_code FROM users WHERE id = $1', [uid]);
        //     if (userRes.rows[0].paystack_customer_code) {
        //         await provisionDvaForBooking(booking.id, uid, userRes.rows[0].email);
        //     }
        //     } catch (dvaError) {
        //     console.error(`Failed to provision DVA for booking ${booking.id}:`, dvaError);
        //     // Admin can manually trigger or user can use fallback payment link
        //     }
        // });

        res.status(201).json({
            bookingId: booking.id,
            amount: parseFloat(booking.total_amount.toString()),
            currency: booking.currency,
            status: booking.status
            // dvaAccountNumber: dvaDetails?.accountNumber || null,
            // dvaBankName: dvaDetails?.bankSlug || null
        });

    } catch (error: any) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: error.message || 'Failed to create booking' });
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

        // Security: Ensure user owns this booking
        if (booking.user_id !== req.user.userId) {
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
        const { listingId, startDate, endDate } = req.body;

        if (!listingId || !startDate || !endDate) {
            res.status(400).json({ message: 'Listing ID, start date, and end date are required' });
            return;
        }

        const quote = await BookingModel.getQuote(listingId, startDate, endDate);
        res.status(200).json(quote);
    } catch (error: any) {
        console.error('Get quote error:', error);
        res.status(500).json({ message: error.message || 'Failed to get quote' });
    }
};
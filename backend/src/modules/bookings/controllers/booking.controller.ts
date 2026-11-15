import { Request, Response } from 'express';
import { BookingModel, getHoldDeadline } from '../models/Booking.js';
import { BookingHubModel } from '../models/BookingHub.js';
import { RefundModel } from '../../payments/models/RefundModel.js';
import { bookingEmailService } from '../../../emails/bookingEmails.js';
import type { CreateBookingInput } from '../types/booking.js';
import type { RefundReason, ComplaintCategory } from '../types/hub.js';

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

        const { booking, reused } = await BookingModel.createBooking(req.user.userId, {
            listingId, startDate, endDate, startTime, endTime,
            preferences, packageId, excludedDates,
        });

        res.status(reused ? 200 : 201).json({
            bookingId: booking.id,
            amount: parseFloat(booking.total_amount.toString()),
            currency: booking.currency,
            status: booking.status,
            expiresAt: booking.expires_at,
            holdDeadline: getHoldDeadline(booking.created_at),
        });
    } catch (error: any) {
        console.error('Create booking error:', error);
        const message: string = error?.message ?? '';

        if (message === 'DATES_UNAVAILABLE') {
            res.status(409).json({
                message: 'These dates are no longer available — another customer may be checking out. Please pick different dates.',
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
        res.status(500).json({ message: 'Failed to create booking' });
    }
};

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

/** GET /api/bookings/:id — wizard/confirmation contract (unchanged). */
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

// ─────────────────────────── Saved hub ───────────────────────────

/** GET /api/bookings/mine — bucketed bookings with server-computed actions. */
export const getMyBookings = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const bookings = await BookingHubModel.findMine(Number(req.user.userId));
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ bookings });
    } catch (error: any) {
        console.error('Get my bookings error:', error);
        res.status(500).json({ message: 'Failed to fetch your bookings' });
    }
};

/** GET /api/bookings/:id/hub — enriched details for the hub modal. */
export const getHubBookingDetails = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const details = await BookingHubModel.findHubDetails(req.params.id, Number(req.user.userId));
        if (!details) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json(details);
    } catch (error: any) {
        console.error('Get hub booking details error:', error);
        res.status(500).json({ message: 'Failed to fetch booking details' });
    }
};

/** GET /api/bookings/:id/refund — current refund request status. */
export const getRefundStatus = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const details = await BookingHubModel.findHubDetails(req.params.id, Number(req.user.userId));
        if (!details) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }
        const refund = await RefundModel.getForBooking(req.params.id);
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ refund });
    } catch (error: any) {
        console.error('Get refund status error:', error);
        res.status(500).json({ message: 'Failed to fetch refund status' });
    }
};

/** POST /api/bookings/:id/refund — reviewed FULL refund request. */
export const requestRefund = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { reason, description } = req.body as { reason: RefundReason; description: string };
        const result = await BookingHubModel.requestRefund(req.params.id, Number(req.user.userId), { reason, description });

        // Emails are best-effort — the request is already durably stored.
        try {
            await bookingEmailService.sendRefundRequestToSupport(
                result.bookingReference, result.customerName, result.customerEmail,
                result.listingTitle, result.totalAmount, reason, description
            );
            await bookingEmailService.sendRefundRequestAckToCustomer(
                result.customerEmail, result.customerName, result.listingTitle,
                result.bookingReference, result.totalAmount
            );
        } catch (emailError) {
            console.error('Refund request emails failed (request still recorded):', emailError);
        }

        res.status(201).json({ refundId: result.refundId, status: 'pending', message: 'Refund request submitted for review.' });
    } catch (error: any) {
        const message: string = error?.message ?? '';
        if (message === 'FORBIDDEN') { res.status(403).json({ message: 'Forbidden: You do not own this booking' }); return; }
        if (message === 'BOOKING_NOT_FOUND') { res.status(404).json({ message: 'Booking not found' }); return; }
        if (message === 'INVALID_REASON') { res.status(400).json({ message: 'Please choose a valid refund reason' }); return; }
        if (message === 'DESCRIPTION_TOO_SHORT') { res.status(400).json({ message: 'Please describe your reason in at least 10 characters' }); return; }
        if (message === 'INVALID_STATUS') { res.status(400).json({ message: 'This booking is not eligible for a refund' }); return; }
        if (message === 'REFUND_WINDOW_CLOSED') {
            res.status(400).json({ message: 'The refund window for this booking has closed (24 hours after the event ends). Contact support if you need help.' });
            return;
        }
        if (message === 'REFUND_ALREADY_REQUESTED') { res.status(409).json({ message: 'A refund request is already in progress for this booking' }); return; }
        console.error('Request refund error:', error);
        res.status(500).json({ message: 'Failed to submit refund request' });
    }
};

/** POST /api/bookings/:id/complaint — stored + emailed to support. */
export const submitComplaint = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { category, subject, message } = req.body as { category: ComplaintCategory; subject?: string; message: string };
        const result = await BookingHubModel.createComplaint(req.params.id, Number(req.user.userId), { category, subject, message });

        try {
            await bookingEmailService.sendComplaintToSupport(
                result.bookingReference, result.customerName, result.customerEmail,
                result.listingTitle, category, subject ?? '', message
            );
            await bookingEmailService.sendComplaintAckToCustomer(
                result.customerEmail, result.customerName, result.bookingReference
            );
        } catch (emailError) {
            console.error('Complaint emails failed (complaint still recorded):', emailError);
        }

        res.status(201).json({ complaintId: result.complaintId, message: 'Complaint submitted. Our support team will reach out.' });
    } catch (error: any) {
        const msg: string = error?.message ?? '';
        if (msg === 'FORBIDDEN') { res.status(403).json({ message: 'Forbidden: You do not own this booking' }); return; }
        if (msg === 'BOOKING_NOT_FOUND') { res.status(404).json({ message: 'Booking not found' }); return; }
        if (msg === 'INVALID_CATEGORY') { res.status(400).json({ message: 'Please choose a valid complaint category' }); return; }
        if (msg === 'MESSAGE_TOO_SHORT') { res.status(400).json({ message: 'Please describe the issue in at least 10 characters' }); return; }
        console.error('Submit complaint error:', error);
        res.status(500).json({ message: 'Failed to submit complaint' });
    }
};
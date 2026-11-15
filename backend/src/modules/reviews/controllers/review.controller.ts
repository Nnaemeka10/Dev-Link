import { Request, Response } from 'express';
import { ReviewModel } from '../models/Review.js';
import type { SubmitReviewInput } from '../types/review.js';

function serialize(row: NonNullable<Awaited<ReturnType<typeof ReviewModel.getForBooking>>>) {
    return {
        id: row.id,
        bookingId: row.booking_id,
        listingId: row.listing_id,
        rating: parseFloat(String(row.rating)),
        body: row.body ?? '',
        subRatings: row.sub_ratings ?? {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/** GET /api/bookings/:id/review — the caller's review (or null). */
export const getMyReview = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const review = await ReviewModel.getForBooking(req.params.id, Number(req.user.userId));
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ review: review ? serialize(review) : null });
    } catch (error: any) {
        console.error('Get my review error:', error);
        res.status(500).json({ message: 'Failed to fetch your review' });
    }
};

/** POST /api/bookings/:id/review — create or edit the one review. */
export const submitReview = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { rating, body, subRatings } = req.body as SubmitReviewInput;
        const review = await ReviewModel.upsert(req.params.id, Number(req.user.userId), { rating, body, subRatings });
        res.status(200).json({ review: serialize(review), message: 'Review saved.' });
    } catch (error: any) {
        const message: string = error?.message ?? '';
        if (message === 'FORBIDDEN') { res.status(403).json({ message: 'Forbidden: You do not own this booking' }); return; }
        if (message === 'BOOKING_NOT_FOUND') { res.status(404).json({ message: 'Booking not found' }); return; }
        if (message === 'NOT_REVIEWABLE') { res.status(400).json({ message: 'You can review this booking once the vendor confirms it.' }); return; }
        if (message === 'INVALID_RATING') { res.status(400).json({ message: 'Overall rating must be between 1 and 5' }); return; }
        if (message === 'BODY_TOO_SHORT') { res.status(400).json({ message: 'Please write at least 10 characters in your review' }); return; }
        if (message === 'INVALID_SUB_RATINGS') { res.status(400).json({ message: 'Please rate every category between 1 and 5' }); return; }
        console.error('Submit review error:', error);
        res.status(500).json({ message: 'Failed to save review' });
    }
};
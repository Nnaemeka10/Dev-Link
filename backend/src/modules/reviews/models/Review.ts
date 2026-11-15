import { getDB } from '../../../lib/db.js';
import type { PoolClient } from 'pg';
import { dimensionsForKind, type ReviewRow, type SubmitReviewInput } from '../types/review.js';

// Reviewing is allowed once the vendor confirmed (ongoing) or the event settled.
const REVIEWABLE_STATUSES = ['confirmed', 'completed', 'processing_payout', 'payout_released'];

function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

/**
 * Recompute the listing's overall rating/count and its kind-specific
 * sub-rating aggregates. Averages ignore reviews missing a given key
 * (e.g. legacy seed reviews), so hall and service dimensions coexist.
 */
async function recomputeAggregates(client: PoolClient, listingId: string, kind: string): Promise<void> {
    const { rows } = await client.query(
        `SELECT
            COUNT(*)::int AS review_count,
            COALESCE(AVG(rating), 0) AS average_rating,
            AVG((sub_ratings->>'cleanliness')::numeric)      AS cleanliness,
            AVG((sub_ratings->>'communication')::numeric)    AS communication,
            AVG((sub_ratings->>'value_for_money')::numeric)  AS value_for_money,
            AVG((sub_ratings->>'location')::numeric)         AS location,
            AVG((sub_ratings->>'facility_quality')::numeric) AS facility_quality,
            AVG((sub_ratings->>'quality_of_work')::numeric)  AS quality_of_work,
            AVG((sub_ratings->>'professionalism')::numeric)  AS professionalism,
            AVG((sub_ratings->>'punctuality')::numeric)      AS punctuality
         FROM listing_reviews
         WHERE listing_id = $1`,
        [listingId]
    );
    const agg = rows[0];
    const num = (v: unknown): number => (v == null ? 0 : round1(parseFloat(String(v))));

    const subMetrics: Record<string, number> = {};
    for (const dim of dimensionsForKind(kind)) {
        subMetrics[dim.key] = num(agg[dim.key]);
    }

    await client.query(
        `UPDATE listings SET average_rating = $2, review_count = $3 WHERE id = $1`,
        [listingId, num(agg.average_rating), agg.review_count]
    );

    await client.query(
        `INSERT INTO listing_review_metrics
            (listing_id, cleanliness, communication, value_for_money, location, facility_quality, sub_metrics, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (listing_id) DO UPDATE SET
            cleanliness = EXCLUDED.cleanliness,
            communication = EXCLUDED.communication,
            value_for_money = EXCLUDED.value_for_money,
            location = EXCLUDED.location,
            facility_quality = EXCLUDED.facility_quality,
            sub_metrics = EXCLUDED.sub_metrics,
            updated_at = NOW()`,
        [listingId, num(agg.cleanliness), num(agg.communication), num(agg.value_for_money),
         num(agg.location), num(agg.facility_quality), JSON.stringify(subMetrics)]
    );
}

export const ReviewModel = {
    /** The caller's review for a booking (prefills the edit modal). Ownership enforced. */
    async getForBooking(bookingId: string, userId: number): Promise<ReviewRow | null> {
        const db = getDB();
        const { rows } = await db.query<ReviewRow>(
            `SELECT lr.*
             FROM listing_reviews lr
             JOIN bookings b ON b.id = lr.booking_id
             WHERE lr.booking_id = $1 AND b.user_id = $2`,
            [bookingId, userId]
        );
        return rows[0] ?? null;
    },

    /**
     * Create or edit the one review for a booking. Validates ownership,
     * eligibility, overall rating, and the exact kind-specific sub-rating
     * keys, then recomputes listing aggregates — all in one transaction.
     * Throws sentinel errors the controller maps to HTTP codes.
     */
    async upsert(bookingId: string, userId: number, input: SubmitReviewInput): Promise<ReviewRow> {
        // Overall rating: 1–5 in half steps.
        const rating = Number(input.rating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5 || (rating * 2) % 1 !== 0) {
            throw new Error('INVALID_RATING');
        }
        const body = (input.body ?? '').trim();
        if (body.length < 10) throw new Error('BODY_TOO_SHORT');

        const db = getDB();
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                `SELECT b.id, b.user_id, b.listing_id, b.status, l.kind
                 FROM bookings b
                 JOIN listings l ON l.id = b.listing_id
                 WHERE b.id = $1
                 FOR UPDATE OF b`,
                [bookingId]
            );
            const booking = rows[0];
            if (!booking) throw new Error('BOOKING_NOT_FOUND');
            if (Number(booking.user_id) !== Number(userId)) throw new Error('FORBIDDEN');
            if (!REVIEWABLE_STATUSES.includes(booking.status)) throw new Error('NOT_REVIEWABLE');

            // Sub-ratings: exactly the kind's dimensions, each an integer 1–5.
            const dims = dimensionsForKind(booking.kind);
            const subs = input.subRatings ?? {};
            const subKeys = Object.keys(subs);
            if (subKeys.length !== dims.length) throw new Error('INVALID_SUB_RATINGS');
            const cleanSubs: Record<string, number> = {};
            for (const dim of dims) {
                const v = Number(subs[dim.key]);
                if (!Number.isInteger(v) || v < 1 || v > 5) throw new Error('INVALID_SUB_RATINGS');
                cleanSubs[dim.key] = v;
            }

            const upserted = await client.query<ReviewRow>(
                `INSERT INTO listing_reviews (listing_id, user_id, booking_id, rating, body, sub_ratings)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (booking_id) WHERE booking_id IS NOT NULL DO UPDATE SET
                    rating = EXCLUDED.rating,
                    body = EXCLUDED.body,
                    sub_ratings = EXCLUDED.sub_ratings,
                    updated_at = NOW()
                 RETURNING *`,
                [booking.listing_id, userId, bookingId, rating, body, JSON.stringify(cleanSubs)]
            );

            await recomputeAggregates(client, booking.listing_id, booking.kind);

            await client.query('COMMIT');
            return upserted.rows[0];
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    },
};
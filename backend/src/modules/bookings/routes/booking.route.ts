import express from 'express';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { arcjetProtection } from '../../../middleware/arcject.middleware.js';
import {
    createBooking,
    getBookingDetails,
    getBookingQuote,
    heartbeatBookingHold,
    releaseBookingHold,
    getMyBookings,
    getHubBookingDetails,
    getRefundStatus,
    requestRefund,
    submitComplaint,
} from '../controllers/booking.controller.js';
import { getMyReview, submitReview } from '../../reviews/controllers/review.controller.js';

const router = express.Router();

router.use(arcjetProtection);

// public routes
router.post('/quote', getBookingQuote);

// authenticated routes - /mine MUST precede /:id
router.post('/', authenticateUser, createBooking);
router.get('/mine', authenticateUser, getMyBookings);
router.get('/:id', authenticateUser, getBookingDetails);
router.get('/:id/hub', authenticateUser, getHubBookingDetails);
router.get('/:id/refund', authenticateUser, getRefundStatus);
router.post('/:id/refund', authenticateUser, requestRefund);
router.post('/:id/complaint', authenticateUser, submitComplaint);
router.get('/:id/review', authenticateUser, getMyReview);
router.post('/:id/review', authenticateUser, submitReview);
router.post('/:id/heartbeat', authenticateUser, heartbeatBookingHold);
router.post('/:id/release-hold', authenticateUser, releaseBookingHold);

export default router;
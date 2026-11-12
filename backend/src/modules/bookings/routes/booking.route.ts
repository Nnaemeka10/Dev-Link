import express from 'express';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { arcjetProtection } from '../../../middleware/arcject.middleware.js';
import {
    createBooking,
    getBookingDetails,
    getBookingQuote,
    heartbeatBookingHold,
    releaseBookingHold,
} from '../controllers/booking.controller.js';

const router = express.Router();

router.use(arcjetProtection);

// public routes
router.post('/quote', getBookingQuote);

// booking routes requiring authentication
router.post('/', authenticateUser, createBooking);
router.get('/:id', authenticateUser, getBookingDetails);
router.post('/:id/heartbeat', authenticateUser, heartbeatBookingHold);
router.post('/:id/release-hold', authenticateUser, releaseBookingHold);

export default router;
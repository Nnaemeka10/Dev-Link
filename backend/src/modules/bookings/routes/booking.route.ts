import express from 'express';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { arcjetProtection } from '../../../middleware/arcject.middleware.js';
import { createBooking, getBookingDetails, getBookingQuote } from '../controllers/booking.controller.js';

const router = express.Router();



router.use(arcjetProtection);

//public routes
router.post('/quote', getBookingQuote);

// booking routes requiring authentication
router.post('/', authenticateUser, createBooking);
router.get('/:id', authenticateUser, getBookingDetails);

export default router;
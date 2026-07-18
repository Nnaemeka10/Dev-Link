import express from 'express';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { arcjetProtection } from '../../../middleware/arcject.middleware.js';
import { createBooking, getBookingDetails } from '../controllers/booking.controller.js';

const router = express.Router();

// All booking routes require authentication
router.use(authenticateUser);
router.use(arcjetProtection);

router.post('/', createBooking);
router.get('/:id', getBookingDetails);

export default router;
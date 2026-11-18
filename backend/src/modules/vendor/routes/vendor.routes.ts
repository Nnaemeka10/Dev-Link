// src/modules/vendor/routes/vendor.route.ts
import express from 'express';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import {
  getSummary,
  getTransactions,
  getTransactionDetails,
  getBookings,
  getBookingDetails,
  getMyListingsStats,
  confirmBooking,
  declineBooking,
} from '../controllers/vendorDashboard.controller.js';
import {
  autosaveDraft,
  createListingDraft,
  getMyListings,
  getListingDraft,
  publishListing,
  signUpload,
  deleteListingDraft,
  unlistListing,
  relistListing,
} from '../controllers/vendorListing.controller.js';

const router = express.Router();

// All vendor dashboard routes require authentication
router.use(authenticateUser);

// Dashboard
router.get('/dashboard/summary', getSummary);

// Completed payouts (ledger-backed). /transactions/:id must follow the list.
router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransactionDetails);

// Bookings - list first, then the parameterized detail route.
router.get('/bookings', getBookings);
router.get('/bookings/:id', getBookingDetails);
router.patch('/bookings/:id/confirm', confirmBooking);
router.patch('/bookings/:id/decline', declineBooking);

// Listings
router.get('/listings', getMyListings);
router.get('/listings/stats', getMyListingsStats);
router.get('/listings/:id/draft', getListingDraft);
router.post('/uploads/cloudinary/sign', signUpload);
router.post('/listings', createListingDraft);
router.patch('/listings/:id/draft', autosaveDraft);
router.post('/listings/:id/publish', publishListing);
// Lifecycle: unlist keeps every booking and allows relist; delete is refused
// while upcoming bookings exist (409 ACTIVE_BOOKINGS).
router.patch('/listings/:id/unlist', unlistListing);
router.patch('/listings/:id/relist', relistListing);
router.delete('/listings/:id', deleteListingDraft);

export default router;
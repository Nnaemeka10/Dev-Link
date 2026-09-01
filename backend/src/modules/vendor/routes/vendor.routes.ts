// src/modules/vendor/routes/vendor.route.ts
import express from 'express';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { 
  getSummary, 
  getTransactions, 
  getBookings, 
  getMyListingsStats ,
} from '../controllers/vendorDashboard.controller.js';
import { autosaveDraft, createListingDraft, getMyListings, getListingDraft, publishListing, signUpload } from '../controllers/vendorListing.controller.js';

const router = express.Router();

// All vendor dashboard routes require authentication
router.use(authenticateUser);

router.get('/listings', getMyListings); // listings owned by the authenticated vendor
router.get('/dashboard/summary', getSummary);
router.get('/dashboard/transactions', getTransactions);
router.get('/bookings', getBookings);
router.get('/listings/stats', getMyListingsStats);
router.get('/listings/:id/draft', getListingDraft);

router.post('/uploads/cloudinary/sign', signUpload); 
router.post('/listings', createListingDraft);               // create a draft listing
router.patch('/listings/:id/draft', autosaveDraft);        // debounced autosave
router.post('/listings/:id/publish', publishListing);  // publish a listing 

export default router;
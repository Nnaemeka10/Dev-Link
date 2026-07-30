import express from 'express';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { submitPayoutMethod, getPayoutMethodStatus, getBanks, removePayoutMethod } from '../controllers/vendorVerification.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/payout-method', submitPayoutMethod);
router.get('/payout-method/status', getPayoutMethodStatus);
router.get('/banks', getBanks);
router.delete('/payout-method', removePayoutMethod);

export default router;
import express from 'express';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { initializePayment, verifyPayment, paystackWebhookIngestor, paystackTransferApproval } from '../controllers/payment.controller.js';

const router = express.Router();

// Webhook route does NOT use authenticateUser or express.json() here because app.ts already captured the raw body for it.
router.post('/webhook', paystackWebhookIngestor);

//Transfer approval: Must be fast, no auth middleware (Paystack calls it)
router.post('/transfer-approval', paystackTransferApproval);

// Standard JSON routes
router.post('/initialize', authenticateUser, initializePayment);
router.get('/verify/:reference', authenticateUser, verifyPayment);

export default router;

import express from 'express';
import {
    signup,
    login,
    logout,
    getCurrentUser,
    sendVerificationEmail,
    verifyEmail,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    googleAuth,
} from '../controllers/auth.controller.js';
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { arcjetProtection } from '../../../middleware/arcject.middleware.js';

const router = express.Router();

// arcject protection
router.use(arcjetProtection);

// public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/send-verification-email', sendVerificationEmail);
router.post('/verify-email', verifyEmail);

// protected routes
router.get('/me', authenticateUser, getCurrentUser);


export default router;
import express from 'express';
import { 
    signup, 
    login, 
    logout, 
    getCurrentUser, 
    sendVerificationEmail, 
    verifyEmail, 
    forgotPassword, 
    resetPassword 
} from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { arcjetProtection } from '../middleware/arcject.middleware.js';



const router = express.Router();

//arcject protection
router.use(arcjetProtection)

//public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

//protected routes 
router.get('/me', authenticateUser, getCurrentUser);
router.post('/send-verification-email', authenticateUser, sendVerificationEmail);
router.post('/verify-email', authenticateUser, verifyEmail);

export default router;
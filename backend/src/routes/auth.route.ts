import express from 'express';
import { signup, login, logout, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { get } from 'http';


const router = express.Router();

//public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

//protected routes
router.get('/me', authenticateUser, getCurrentUser);
export default router;
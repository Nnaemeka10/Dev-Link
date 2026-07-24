import { Router } from "express";
import * as controller from "../controller/profile.controller.js";
import { authenticateUser } from '../../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Profile CRUD
router.get("/", controller.getProfile);
router.patch("/", controller.updateProfile);
router.delete("/", controller.deactivateAccount);

// Avatar upload signature
router.get("/avatar/signature", controller.getAvatarUploadSignature);

// Bookings
router.get("/bookings", controller.getBookings);

// Payment methods (Paystack)
router.get("/payment-methods", controller.getPaymentMethods);
router.patch("/payment-methods/:authCode/default", controller.setDefaultPaymentMethod);
router.delete("/payment-methods/:authCode", controller.removePaymentMethod);

// Notifications
router.get("/notifications", controller.getNotificationSettings);
router.patch("/notifications", controller.updateNotificationSettings);

// Security
router.post("/change-password", controller.changePassword);

export default router;
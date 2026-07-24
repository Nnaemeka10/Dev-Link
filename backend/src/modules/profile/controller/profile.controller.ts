import { Request, Response } from "express";
import { ProfileService } from "../models/Profile.js";
import cloudinary from "../../../lib/cloudinary.js";
import { ENV } from "../../../lib/env.js";
import type {
  UpdateProfileBody,
  ChangePasswordBody,
  UpdateNotificationsBody,
} from "../types/profile.types.js";

// ─── GET /api/profile ────────────────────────────────────────────────────────
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const profile = await ProfileService.getProfile(req.user.userId);
    res.status(200).json(profile);
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ─── PATCH /api/profile ──────────────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const body: UpdateProfileBody = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ message: "Invalid profile payload" });
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate avatar URL is from our Cloudinary if provided
    if (body.avatarUrl && !/^https:\/\/res\.cloudinary\.com\//.test(body.avatarUrl)) {
      return res.status(400).json({ message: "Invalid avatar URL" });
    }

    const profile = await ProfileService.updateProfile(req.user.userId, body);
    res.status(200).json(profile);
  } catch (error: any) {
    console.error("Update profile error:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already in use" });
    }
    if (
      typeof error.message === "string" &&
      (error.message.includes("must be a string") ||
        error.message.includes("is too long") ||
        error.message.includes("email is required"))
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ─── GET /api/profile/avatar/signature ───────────────────────────────────────
export const getAvatarUploadSignature = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });
    if (!ENV.CLOUDINARY_API_SECRET || !ENV.CLOUDINARY_API_KEY || !ENV.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ message: "Cloudinary is not configured" });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `eventvnv_avatars/${req.user.userId}`;

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      ENV.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      signature,
      timestamp,
      folder,
      apiKey: ENV.CLOUDINARY_API_KEY,
      cloudName: ENV.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error: any) {
    console.error("Avatar signature error:", error);
    res.status(500).json({ message: "Failed to generate upload signature" });
  }
};

// ─── GET /api/profile/bookings ───────────────────────────────────────────────
export const getBookings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const bookings = await ProfileService.getBookings(req.user.userId);
    res.status(200).json(bookings);
  } catch (error: any) {
    console.error("Get bookings error:", error);
    res.status(500).json({ message: "Failed to fetch booking history" });
  }
};

// ─── GET /api/profile/payment-methods ────────────────────────────────────────
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const methods = await ProfileService.getPaymentMethods(req.user.userId);
    res.status(200).json(methods);
  } catch (error: any) {
    console.error("Get payment methods error:", error);
    res.status(500).json({ message: "Failed to fetch payment methods" });
  }
};

// ─── PATCH /api/profile/payment-methods/:authCode/default ────────────────────
export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const { authCode } = req.params;
    if (!authCode) return res.status(400).json({ message: "Authorization code is required" });

    await ProfileService.setDefaultPaymentMethod(req.user.userId, authCode);
    res.status(200).json({ message: "Default payment method updated" });
  } catch (error: any) {
    console.error("Set default payment error:", error);
    const status =
      error.message === "Payment method not found" ||
      error.message === "No Paystack customer linked to this account"
        ? 404
        : 500;
    res.status(status).json({ message: error.message || "Failed to set default payment method" });
  }
};

// ─── DELETE /api/profile/payment-methods/:authCode ───────────────────────────
export const removePaymentMethod = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const { authCode } = req.params;
    if (!authCode) return res.status(400).json({ message: "Authorization code is required" });

    await ProfileService.removePaymentMethod(req.user.userId, authCode);
    res.status(200).json({ message: "Payment method removed" });
  } catch (error: any) {
    console.error("Remove payment method error:", error);
    res.status(500).json({ message: "Failed to remove payment method" });
  }
};

// ─── GET /api/profile/notifications ──────────────────────────────────────────
export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const settings = await ProfileService.getNotificationSettings(req.user.userId);
    res.status(200).json(settings);
  } catch (error: any) {
    console.error("Get notification settings error:", error);
    res.status(500).json({ message: "Failed to fetch notification settings" });
  }
};

// ─── PATCH /api/profile/notifications ────────────────────────────────────────
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const body: UpdateNotificationsBody = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ message: "Invalid notification payload" });
    }

    // Ensure at least one field is provided
    if (Object.keys(body).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const allowedKeys = new Set([
      "emailPromotions",
      "smsAlerts",
      "pushNotifications",
      "bookingUpdates",
    ]);
    for (const [key, value] of Object.entries(body)) {
      if (!allowedKeys.has(key)) {
        return res.status(400).json({ message: `Unsupported notification field: ${key}` });
      }
      if (typeof value !== "boolean") {
        return res.status(400).json({ message: `${key} must be a boolean` });
      }
    }

    const settings = await ProfileService.updateNotificationSettings(req.user.userId, body);
    res.status(200).json(settings);
  } catch (error: any) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ message: "Failed to update notification settings" });
  }
};

// ─── POST /api/profile/change-password ───────────────────────────────────────
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const body: ChangePasswordBody = req.body;

    if (!body.currentPassword || !body.newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (body.newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    await ProfileService.changePassword(req.user.userId, body);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    if (error.message === "Current password is incorrect") {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to change password" });
  }
};

// ─── DELETE /api/profile ────────────────────────────────────────────────────
export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

    await ProfileService.deactivateAccount(req.user.userId);
    // Clear the auth cookie so the frontend redirects to login
    res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "lax" });
    res.status(200).json({ message: "Account deactivated" });
  } catch (error: any) {
    console.error("Deactivate account error:", error);
    res.status(500).json({ message: "Failed to deactivate account" });
  }
};

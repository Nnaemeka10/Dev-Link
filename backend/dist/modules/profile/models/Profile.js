import { getDB } from "../../../lib/db.js";
import bcrypt from "bcryptjs";
import { ENV } from "../../../lib/env.js";
// ─── Helpers ─────────────────────────────────────────────────────────────────
const PROFILE_TEXT_LIMITS = {
    firstName: 80,
    lastName: 80,
    email: 254,
    phone: 40,
    location: 160,
    avatarUrl: 500,
};
function normalizeOptionalText(value, field) {
    if (value === null) {
        if (field === "email")
            throw new Error("email is required");
        return null;
    }
    if (typeof value !== "string") {
        throw new Error(`${field} must be a string`);
    }
    const trimmed = value.trim();
    if (trimmed.length > PROFILE_TEXT_LIMITS[field]) {
        throw new Error(`${field} is too long`);
    }
    return trimmed === "" ? null : trimmed;
}
/** Map DB booking_status → frontend-friendly status */
function mapBookingStatus(dbStatus) {
    switch (dbStatus) {
        case "pending":
        case "paid":
            return "pending";
        case "confirmed":
            return "confirmed";
        case "completed":
            return "past";
        case "cancelled":
        case "declined":
        case "failed":
        case "expired":
            return "cancelled";
        default:
            return "pending";
    }
}
/** Fetch Paystack customer authorizations */
async function fetchPaystackAuthorizations(customerCode) {
    if (!ENV.PAYSTACK_SECRET_KEY) {
        throw new Error("Paystack is not configured");
    }
    const res = await fetch(`https://api.paystack.com/customer/${customerCode}/authorization`, {
        headers: {
            Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
    });
    if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Failed to fetch payment methods from Paystack");
    }
    const json = await res.json();
    return json.data || [];
}
// ─── Service ─────────────────────────────────────────────────────────────────
export const ProfileService = {
    // ── GET /api/profile ────────────────────────────────────────────────────
    async getProfile(userId) {
        const db = getDB();
        const userRes = await db.query(`SELECT id, first_name, last_name, email, phone, location, avatar_url,
              is_email_verified, created_at
       FROM users WHERE id = $1 AND is_active = TRUE`, [userId]);
        if (userRes.rows.length === 0)
            throw new Error("User not found");
        const u = userRes.rows[0];
        // Notification prefs (upsert if missing)
        await db.query(`INSERT INTO notifications_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [userId]);
        const prefRes = await db.query(`SELECT email_promotions, sms_alerts, push_notifications, booking_updates
       FROM notifications_preferences WHERE user_id = $1`, [userId]);
        const p = prefRes.rows[0];
        return {
            id: u.id,
            firstName: u.first_name || "",
            lastName: u.last_name || "",
            email: u.email,
            phone: u.phone,
            location: u.location,
            avatarUrl: u.avatar_url,
            isEmailVerified: u.is_email_verified,
            joinDate: u.created_at,
            notifications: {
                emailPromotions: p.email_promotions,
                smsAlerts: p.sms_alerts,
                pushNotifications: p.push_notifications,
                bookingUpdates: p.booking_updates,
            },
        };
    },
    // ── PATCH /api/profile ──────────────────────────────────────────────────
    async updateProfile(userId, body) {
        const db = getDB();
        const sets = [];
        const values = [];
        let paramIndex = 1;
        const fieldMap = {
            firstName: "first_name",
            lastName: "last_name",
            email: "email",
            phone: "phone",
            location: "location",
            avatarUrl: "avatar_url",
        };
        for (const [key, col] of Object.entries(fieldMap)) {
            const val = body[key];
            if (val !== undefined) {
                sets.push(`${col} = $${paramIndex++}`);
                values.push(normalizeOptionalText(val, key));
            }
        }
        if (sets.length === 0) {
            return this.getProfile(userId);
        }
        sets.push(`updated_at = NOW()`);
        values.push(userId);
        await db.query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${paramIndex}`, values);
        return this.getProfile(userId);
    },
    // ── GET /api/profile/bookings ───────────────────────────────────────────
    async getBookings(userId) {
        const db = getDB();
        const res = await db.query(`SELECT
        b.id,
        b.start_date,
        b.total_amount,
        b.status,
        b.created_at AS booked_on,
        COALESCE(b.guests, 1) AS ticket_count,
        l.title AS event_title,
        COALESCE(NULLIF(CONCAT_WS(', ', l.city, l.state), ''), l.country, '') AS location,
        u.first_name AS vendor_first,
        u.last_name AS vendor_last,
        la.url AS image_url
      FROM bookings b
      JOIN listings l ON l.id = b.listing_id
      JOIN users u ON u.id = l.vendor_id
      LEFT JOIN listing_assets la ON la.listing_id = l.id AND la.is_primary = TRUE
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT 50`, [userId]);
        return res.rows.map((row) => ({
            id: row.id,
            eventTitle: row.event_title,
            vendorName: `${row.vendor_first || ""} ${row.vendor_last || ""}`.trim(),
            eventDate: row.start_date,
            bookedOn: row.booked_on,
            status: mapBookingStatus(row.status),
            amount: Number(row.total_amount),
            imageUrl: row.image_url,
            location: row.location,
            ticketCount: Number(row.ticket_count) || 1,
        }));
    },
    // ── GET /api/profile/payment-methods ────────────────────────────────────
    async getPaymentMethods(userId) {
        const db = getDB();
        // Get user's Paystack customer code
        const userRes = await db.query(`SELECT paystack_customer_code FROM users WHERE id = $1`, [userId]);
        const customerCode = userRes.rows[0]?.paystack_customer_code;
        if (!customerCode)
            return [];
        // Fetch authorizations from Paystack
        let authorizations;
        try {
            authorizations = await fetchPaystackAuthorizations(customerCode);
        }
        catch {
            return [];
        }
        const [hiddenRes, defaultRes] = await Promise.all([
            db.query(`SELECT authorization_code FROM user_hidden_payment_methods WHERE user_id = $1`, [userId]),
            db.query(`SELECT authorization_code FROM user_default_payment_methods WHERE user_id = $1`, [userId]),
        ]);
        const defaultAuthCode = defaultRes.rows[0]?.authorization_code;
        const hiddenCodes = new Set(hiddenRes.rows.map((r) => r.authorization_code));
        // Filter out hidden and non-reusable
        const visible = authorizations.filter((a) => a.reusable && !hiddenCodes.has(a.authorization_code));
        if (visible.length === 0)
            return [];
        const effectiveDefault = visible.some((a) => a.authorization_code === defaultAuthCode)
            ? defaultAuthCode
            : visible[0].authorization_code;
        return visible.map((a) => ({
            id: a.authorization_code,
            type: a.channel === "card" ? "card" : "bank_transfer",
            label: a.channel === "card" ? (a.brand || a.card_type || "Card").toUpperCase() : a.bank,
            last4: a.last4,
            expiryDate: a.channel === "card" ? `${a.exp_month}/${a.exp_year}` : undefined,
            isDefault: a.authorization_code === effectiveDefault,
        }));
    },
    // ── PATCH /api/profile/payment-methods/:authCode/default ────────────────
    async setDefaultPaymentMethod(userId, authCode) {
        const db = getDB();
        const customerCode = await db
            .query(`SELECT paystack_customer_code FROM users WHERE id = $1 AND is_active = TRUE`, [userId])
            .then((r) => r.rows[0]?.paystack_customer_code);
        if (!customerCode)
            throw new Error("No Paystack customer linked to this account");
        const authorizations = await fetchPaystackAuthorizations(customerCode);
        const isValidAuthorization = authorizations.some((a) => a.authorization_code === authCode && a.reusable);
        if (!isValidAuthorization) {
            throw new Error("Payment method not found");
        }
        await db.query(`INSERT INTO user_default_payment_methods (user_id, authorization_code)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET authorization_code = EXCLUDED.authorization_code, updated_at = NOW()`, [userId, authCode]);
    },
    // ── DELETE /api/profile/payment-methods/:authCode ───────────────────────
    async removePaymentMethod(userId, authCode) {
        // Paystack has no delete authorization API.
        // We blacklist it locally so it stops appearing in our UI.
        const db = getDB();
        await db.query(`INSERT INTO user_hidden_payment_methods (user_id, authorization_code)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`, [userId, authCode]);
        await db.query(`DELETE FROM user_default_payment_methods
       WHERE user_id = $1 AND authorization_code = $2`, [userId, authCode]);
    },
    // ── GET /api/profile/notifications ──────────────────────────────────────
    async getNotificationSettings(userId) {
        const db = getDB();
        await db.query(`INSERT INTO notifications_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [userId]);
        const res = await db.query(`SELECT email_promotions, sms_alerts, push_notifications, booking_updates
       FROM notifications_preferences WHERE user_id = $1`, [userId]);
        const r = res.rows[0];
        return {
            emailPromotions: r.email_promotions,
            smsAlerts: r.sms_alerts,
            pushNotifications: r.push_notifications,
            bookingUpdates: r.booking_updates,
        };
    },
    // ── PATCH /api/profile/notifications ────────────────────────────────────
    async updateNotificationSettings(userId, body) {
        const db = getDB();
        const sets = [];
        const values = [];
        let idx = 1;
        const colMap = {
            emailPromotions: "email_promotions",
            smsAlerts: "sms_alerts",
            pushNotifications: "push_notifications",
            bookingUpdates: "booking_updates",
        };
        for (const [key, col] of Object.entries(colMap)) {
            if (body[key] !== undefined) {
                sets.push(`${col} = $${idx++}`);
                values.push(body[key]);
            }
        }
        if (sets.length > 0) {
            sets.push(`updated_at = NOW()`);
            values.push(userId);
            await db.query(`INSERT INTO notifications_preferences (user_id)
         VALUES ($${idx})
         ON CONFLICT (user_id) DO UPDATE SET ${sets.join(", ")}`, values);
        }
        return this.getNotificationSettings(userId);
    },
    // ── POST /api/profile/change-password ───────────────────────────────────
    async changePassword(userId, body) {
        const db = getDB();
        // Fetch current hash
        const res = await db.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
        if (res.rows.length === 0)
            throw new Error("User not found");
        // Verify current password
        const isValid = await bcrypt.compare(body.currentPassword, res.rows[0].password_hash);
        if (!isValid) {
            throw new Error("Current password is incorrect");
        }
        // Validate new password length
        if (body.newPassword.length < 8) {
            throw new Error("New password must be at least 8 characters");
        }
        // Hash and save
        const newHash = await bcrypt.hash(body.newPassword, 12);
        await db.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, userId]);
    },
    // ── DELETE /api/profile ─────────────────────────────────────────────────
    async deactivateAccount(userId) {
        const db = getDB();
        await db.query(`UPDATE users SET is_active = FALSE, deactivated_at = NOW(), updated_at = NOW() WHERE id = $1`, [userId]);
    },
};
//# sourceMappingURL=Profile.js.map
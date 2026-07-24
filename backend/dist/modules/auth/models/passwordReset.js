// import { getDB } from "../../../lib/db.js";
// import crypto from "crypto";
// import { PasswordResetToken } from "../types/passwordReset.js";
// export const PasswordResetModel = {
//     //generate a secure random token
//     //remind me to hash the token before storing it in the database for added security
//     generatelink(): string {
//          return crypto.randomBytes(32).toString('hex');
//     },
//     generateToken(): string{
//         return crypto.randomInt(100000, 1000000).toString();
//     },
//     //create a new password reset token
//     async create(userId: number): Promise<PasswordResetToken> {
//         const db = getDB();
//         const token = this.generateToken();
//         const link = this.generatelink();
//         const expiresAt = new Date(Date.now() + 60 * 60 * 1000); //1 hour from now
//         //delete existing tokens for the user
//         await this.deleteAllForUser(userId);
//         const query = `
//             INSERT INTO password_reset_tokens (user_id, token, link, expires_at)
//             VALUES ($1, $2, $3, $4)
//             RETURNING *
//         `;
//         const result = await db.query(query, [userId, token, link, expiresAt]);
//         return result.rows[0];
//     },
//     //find valid password reset token
//     async findValidToken(token: string): Promise<PasswordResetToken | null> {
//         const db = getDB();
//         const query = `
//             SELECT * FROM password_reset_tokens
//             WHERE token = $1
//             AND expires_at > NOW()
//             AND used_at IS NULL
//             LIMIT 1
//         `;
//         const result = await db.query(query, [token]);
//         return result.rows[0] || null;
//     },
//     //mark token as used
//     async markAsUsed(id: number): Promise<void> {
//         const db = getDB();
//         const query = `
//             UPDATE password_reset_tokens
//             SET used_at = NOW()
//             WHERE id = $1
//         `;
//         await db.query(query, [id]);
//     },
//     //delete all tokens for a user
//     async deleteAllForUser(userId: number): Promise<void> {
//         const db = getDB();
//         const query = `
//             DELETE FROM password_reset_tokens
//             WHERE user_id = $1
//         `;
//         await db.query(query, [userId]);
//     }
// };
import { getDB } from "../../../lib/db.js";
import crypto from "crypto";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes — window to actually set the new password
export const PasswordResetModel = {
    // generate a secure random link slug
    // remind me to hash the token before storing it in the database for added security
    generatelink() {
        return crypto.randomBytes(32).toString('hex');
    },
    generateToken() {
        return crypto.randomInt(100000, 1000000).toString();
    },
    generateSessionToken() {
        return crypto.randomBytes(32).toString('hex');
    },
    // create a new password reset token
    async create(userId) {
        const db = getDB();
        const token = this.generateToken();
        const link = this.generatelink();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        // delete existing tokens for the user
        await this.deleteAllForUser(userId);
        const query = `
            INSERT INTO password_reset_tokens (user_id, token, link, expires_at)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await db.query(query, [userId, token, link, expiresAt]);
        return result.rows[0];
    },
    // find valid password reset token by the long-lived link/hex token (email link path)
    async findValidToken(token) {
        const db = getDB();
        const query = `
            SELECT * FROM password_reset_tokens
            WHERE link = $1
            AND expires_at > NOW()
            AND used_at IS NULL
            LIMIT 1
        `;
        const result = await db.query(query, [token]);
        return result.rows[0] || null;
    },
    // find the active reset request for a user (used to check OTP against)
    async findActiveByUserId(userId) {
        const db = getDB();
        const query = `
            SELECT * FROM password_reset_tokens
            WHERE user_id = $1
            AND expires_at > NOW()
            AND used_at IS NULL
            ORDER BY id DESC
            LIMIT 1
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0] || null;
    },
    // find a reset request by its session token (set-new-password path, post-OTP)
    async findBySessionToken(sessionToken) {
        const db = getDB();
        const query = `
            SELECT * FROM password_reset_tokens
            WHERE session_token = $1
            AND session_expires_at > NOW()
            AND used_at IS NULL
            LIMIT 1
        `;
        const result = await db.query(query, [sessionToken]);
        return result.rows[0] || null;
    },
    // check whether OTP attempts are currently locked out for this row
    isLocked(record) {
        return !!record.locked_until && new Date(record.locked_until) > new Date();
    },
    // record a failed OTP attempt; locks the row after MAX_ATTEMPTS
    async recordFailedAttempt(id) {
        const db = getDB();
        const query = `
            UPDATE password_reset_tokens
            SET attempts = attempts + 1,
                locked_until = CASE
                    WHEN attempts + 1 >= $2 THEN NOW() + INTERVAL '${LOCK_DURATION_MS} milliseconds'
                    ELSE locked_until
                END
            WHERE id = $1
            RETURNING attempts, locked_until
        `;
        const result = await db.query(query, [id, MAX_ATTEMPTS]);
        return {
            attempts: result.rows[0].attempts,
            lockedUntil: result.rows[0].locked_until,
        };
    },
    // OTP verified successfully -> issue short-lived session token, reset attempts
    async markVerifiedAndIssueSession(id) {
        const db = getDB();
        const sessionToken = this.generateSessionToken();
        const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        const query = `
            UPDATE password_reset_tokens
            SET session_token = $2,
                session_expires_at = $3,
                verified_at = NOW(),
                attempts = 0,
                locked_until = NULL
            WHERE id = $1
        `;
        await db.query(query, [id, sessionToken, sessionExpiresAt]);
        return { sessionToken, sessionExpiresAt };
    },
    // mark token as used (terminal — password has been reset)
    async markAsUsed(id) {
        const db = getDB();
        const query = `
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE id = $1
        `;
        await db.query(query, [id]);
    },
    // delete all tokens for a user
    async deleteAllForUser(userId) {
        const db = getDB();
        const query = `
            DELETE FROM password_reset_tokens
            WHERE user_id = $1
        `;
        await db.query(query, [userId]);
    },
    constants: {
        MAX_ATTEMPTS,
        LOCK_DURATION_MS,
        SESSION_DURATION_MS,
    },
};
//# sourceMappingURL=passwordReset.js.map
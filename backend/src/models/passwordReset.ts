import { getDB } from "../lib/db";
import crypto from "crypto";
import { PasswordResetToken } from "../types/passwordReset";

export const PasswordResetModel = {
    //generate a secure random token
    generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    },

    //create a new password reset token
    async create(userId: number): Promise<PasswordResetToken> {
        const db = getDB();
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); //1 hour from now

        //delete existing tokens for the user
        await this.deleteAllForUser(userId);

        const query = `
            INSERT INTO password_resets (user_id, token, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await db.query(query, [userId, token, expiresAt]);
        return result.rows[0];
    },

    //find valid password reset token
    async findValidToken(token: string): Promise<PasswordResetToken | null> {
        const db = getDB();

        const query = `
            SELECT * FROM password_reset_tokens
            WHERE token = $1
            AND expires_at > NOW()
            AND used_at IS NULL
            LIMIT 1
        `;

        const result = await db.query(query, [token]);
        return result.rows[0] || null;
    },

    //mark token as used
    async markAsUsed(id: number): Promise<void> {
        const db = getDB();
        const query = `
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE id = $1
        `;

        await db.query(query, [id]);
    },

    //delete all tokens for a user
    async deleteAllForUser(userId: number): Promise<void> {
        const db = getDB();
        
        const query = `
            DELETE FROM password_reset_tokens
            WHERE user_id = $1
        `;
        await db.query(query, [userId]);
    }

};
import { getDB } from '../lib/db.js';
import crypto from 'crypto';

import { EmailVerification } from "../types/userVerification";

export const EmailVerificationModel = {
    //generate a 6-digit verification code
    generateCode(): string {
        return crypto.randomInt(100000, 999999).toString();
    },

    //create a new verification code
    async create(userId:number): Promise<EmailVerification> {
        const db = getDB();
        const code = this.generateCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); //15 minutes from now

        const query = `
            INSERT INTO email_verifications (user_id, code, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await db.query(query, [userId, code, expiresAt]);
        return result.rows[0];
    },

    //Find valid verification by user id and code
    async findValidCode(userId: number, code: string): Promise<EmailVerification | null> {
        const db = getDB();
        const query = `
            SELECT * FROM email_verifications
            WHERE user_id = $1
            AND code = $2
            AND expires_at > NOW()
            AND used_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const result = await db.query(query, [userId, code]);
        return result.rows[0] || null;
       
    },

    //Mark code as used
    async markAsUsed(id: number): Promise<void> {
        const db = getDB();
        const query = `
            UPDATE email_verifications
            SET used_at = NOW()
            WHERE id = $1
        `;

        await db.query(query, [id]);
    },

    //deleete all verification codes for a user
    async deleteAllForUser(userId: number): Promise<void> {
        const db = getDB();
        const query = `
            DELETE FROM email_verifications
            WHERE user_id = $1
        `;
        await db.query(query, [userId]);
    }
};

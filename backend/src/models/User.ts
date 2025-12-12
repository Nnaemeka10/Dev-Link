import { getDB } from "../lib/db.js";
import bcrypt from 'bcryptjs';
import type { User, CreateUserInput } from "../types/user.d.ts";


export const UserModel = {
    // Create a new user
    async create(userData: CreateUserInput): Promise<User> {
        const db = getDB();

        // Hash the password before storing
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(userData.password, salt);

        const query = `
            INSERT INTO users (role_id, email, username, password_hash, full_name, headline, phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, role_id, email, username, full_name, headline, phone, is_email_verified, is_active, created_at, updated_at
        `;
        const values = [
            userData.role_id,
            userData.email,
            userData.username || null,
            password_hash,
            userData.full_name || null,
            userData.headline || null,
            userData.phone || null,
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    },

    //find user by email
    async findByEmail(email: string): Promise<User | null> {
        const db = getDB();
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await db.query(query, [email]);

        return result.rows[0] || null;
    },

    //find use by username
    async findByUsername(username: string): Promise<User | null> {
        const db = getDB();
        const query = `SELECT * FROM users WHERE username = $1`;
        const result = await db.query(query, [username]);
        return result.rows[0] || null;
    },

    //find user by id
    async findById(id: number): Promise<User | null> {
        const db = getDB();
        const query = `SELECT * FROM users WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    },

    //verify password
    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    //update user
    async update(id: number, updates: Partial<User>): Promise<User | null> {
        const db = getDB();

        const allowedUpdates = ['full_name', 'headline', 'phone', 'username', 'is_email_verified', 'is_active'];
        const updateFields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        Object.keys(updates).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                updateFields.push(`${key} = $${paramCount}`);
                values.push((updates as any)[key]);
                paramCount++;
            }
        });

        if (updateFields.length === 0) {
            return await this.findById(id); // No valid fields to update
        }

        updateFields.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE users
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0] || null;
    },

    //update user password
    async updatePassword(id: number, newPassword: string): Promise<User | null> {
        const db = getDB();

        //hash new password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        const query = `
            UPDATE users
            SET password_hash = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const result = await db.query(query, [password_hash, id]);
        return result.rows[0] || null;
    }
};

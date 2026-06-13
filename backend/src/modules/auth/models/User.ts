import { getDB } from "../../../lib/db.js";
import bcrypt from 'bcryptjs';
import type { User, CreateUserInput, AllowedUpdates } from "../types/user.js";

//note in this file that we are returning all the contents of the usertable so if new fileds are added ensure we are not returning sensitive information to the frontend. the hashed password is removed in the controller layer
const userPublicFields = `
  id,
  email,
  username,
  headline,
  first_name,
  last_name,
  date_of_birth,
  phone,
  is_email_verified,
  is_active,
  created_at,
  updated_at
`;

export const UserModel = {
    // Create a new user
    async create(userData: CreateUserInput): Promise<User> {
        const db = getDB();

        // Hash the password before storing
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(userData.password, salt);

        // const query = `
        //     INSERT INTO users (role_id, email, username, password_hash, full_name, headline, phone)
        //     VALUES ($1, $2, $3, $4, $5, $6, $7)
        //     RETURNING id, role_id, email, username, full_name, headline, phone, is_email_verified, is_active, created_at, updated_at
        // `;

        const query = `
            INSERT INTO users (email, username, password_hash, first_name, last_name, date_of_birth, headline, phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, email, username, first_name, last_name, date_of_birth, headline, phone, is_email_verified, is_active, created_at, updated_at
        `;
        // const values = [
        //     userData.role_id,
        //     userData.email,
        //     userData.username || null,
        //     password_hash,
        //     userData.full_name || null,
        //     userData.headline || null,
        //     userData.phone || null,
        // ];
         const values = [
            userData.email,
            userData.username || null,
            password_hash,
            userData.first_name || null,
            userData.last_name || null,
            userData.date_of_birth || null,
            userData.headline || null,
            userData.phone || null,
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    },

    //find user by email
    //  async findByEmail(email: string): Promise<User | null> {
    //     const db = getDB();
    //     const query = `SELECT * FROM users WHERE email = $1`;
    //     const result = await db.query(query, [email]);

    //     return result.rows[0] || null;
    // },
    async findByEmail(email: string): Promise<User | null> {
        const db = getDB();
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await db.query(query, [email]);

        return result.rows[0] || null;
    },

    //find use by username
    // async findByUsername(username: string): Promise<User | null> {
    //     const db = getDB();
    //     const query = `SELECT * FROM users WHERE username = $1`;
    //     const result = await db.query(query, [username]);
    //     return result.rows[0] || null;
    // },
    async findByUsername(username: string): Promise<User | null> {
        const db = getDB();
        const query = `SELECT ${userPublicFields} FROM users WHERE username = $1`;
        const result = await db.query(query, [username]);
        return result.rows[0] || null;
    },

    //find user by id
    async findById(id: number): Promise<User | null> {
        const db = getDB();
        const query = `SELECT ${userPublicFields} FROM users WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    },

    //verify password
    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    // //update user
    // async update(id: number, updates: AllowedUpdates): Promise<User | null> {
    //     const fieldMap = {
    //         first_name: "first_name",
    //         last_name: "last_name",
    //         headline: "headline",
    //         phone: "phone",
    //         username: "username",
    //         is_email_verified: "is_email_verified",
    //         is_active: "is_active"
    //     } as const;
        

    //     const db = getDB();

    //     const allowedUpdates: (keyof AllowedUpdates)[] = ['first_name', 'last_name', 'headline', 'phone', 'username', 'is_email_verified', 'is_active'];
    //     const updateFields: string[] = [];
    //     const values: unknown[] = [];
    //     const assignments: { column: string; value: unknown; placeholder: string }[] = [];
    //     let paramCount = 1;

    //     (Object.keys(updates) as (keyof AllowedUpdates)[]).forEach((key) => {
    //         if (allowedUpdates.includes(key)) {
    //             updateFields.push(`${fieldMap[key]} = $${paramCount}`);
    //             values.push((updates[key]));
    //             paramCount++;
    //         }
    //     });

    //     if (updateFields.length === 0) {
    //         return await this.findById(id); // No valid fields to update
    //     }

    //     updateFields.push(`updated_at = NOW()`);
    //     values.push(id);

    //     const query = `
    //         UPDATE users
    //         SET ${updateFields.join(', ')}
    //         WHERE id = $${paramCount}
    //         RETURNING *
    //     `;

    //     const result = await db.query(query, values);
    //     return result.rows[0] || null;
    // },
    
    async update(id: number, updates: AllowedUpdates): Promise<User | null> {
        const db = getDB();

        // Single source of truth: safe column mapping (fixes Bug 5)
        const fieldMap = {
            first_name: "first_name",
            last_name: "last_name",
            headline: "headline",
            phone: "phone",
            username: "username",
            is_email_verified: "is_email_verified",
            is_active: "is_active"
        } as const;

        type FieldKey = keyof typeof fieldMap;

        // Step 1: sanitize + whitelist in one pass
        const entries = Object.entries(updates) as [FieldKey, unknown][];

        // Step 2: structured assignments (fixes Bug 6)
        const assignments: {
            column: string;
            value: unknown;
            placeholder: string;
        }[] = [];

        let paramIndex = 1;

        for (const [key, value] of entries) {
            if (value === undefined) continue;

            const column = fieldMap[key];
            if (!column) continue; // extra safety guard

            assignments.push({
                column,
                value,
                placeholder: `$${paramIndex++}`
            });
        }

        // Step 3: early exit (no-op update)
        if (assignments.length === 0) {
            return this.findById(id);
        }

        // Step 4: build query deterministically
        const setClause = assignments
            .map(a => `${a.column} = ${a.placeholder}`)
            .join(", ");

        const values = assignments.map(a => a.value);

        // Step 5: add id parameter LAST (consistent binding)
        values.push(id);

        const query = `
            UPDATE users
            SET ${setClause}, updated_at = NOW()
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0] ?? null;
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
